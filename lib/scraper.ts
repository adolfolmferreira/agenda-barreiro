// lib/scraper.ts
// Scraper único para https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/
//
// O site da CM Barreiro é WordPress. Os eventos vivem em:
//   - /eventos/{slug}/  (páginas individuais)
//   - /conhecer/agenda-de-eventos/ (listagem com filtros AJAX)
//   - Homepage (widget de agenda com datas e locais)
//
// Estratégia (por ordem de tentativa):
// 1. WP REST API → /wp-json/wp/v2/eventos (custom post type)
// 2. WP REST API → /wp-json/tribe/events/v1/events (The Events Calendar)
// 3. WP REST API → /wp-json/wp/v2/posts?categories=eventos
// 4. Scraping HTML da homepage (que tem eventos visíveis)
// 5. Scraping HTML da página de agenda

import * as cheerio from 'cheerio';

const BASE = 'https://www.cm-barreiro.pt';
const UA = 'AgendaBarreiro/1.0 (+https://github.com/adolfoferreira/agenda-barreiro)';
const HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
};

// ─── Tipos ───
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;         // ISO "2026-03-15"
  endDate?: string;
  time?: string;
  location: string;
  category: string;
  imageUrl?: string;
  sourceUrl: string;
  tags: string[];
  scrapedAt: string;
}

// ─── Entrada principal ───
export async function scrapeEvents(): Promise<Event[]> {
  console.log('🚀 Scraping CM Barreiro...');

  // Tentar APIs primeiro (mais estruturado)
  const apiEvents = await tryAPIs();
  if (apiEvents && apiEvents.length > 0) {
    console.log(`✅ API: ${apiEvents.length} eventos`);
    return apiEvents;
  }

  // Fallback: scraping HTML
  console.log('⚠️ APIs não disponíveis, scraping HTML...');
  const htmlEvents = await scrapeHTML();
  console.log(`✅ HTML: ${htmlEvents.length} eventos`);
  return htmlEvents;
}

// ─── Estratégia 1-3: WordPress REST API ───
async function tryAPIs(): Promise<Event[] | null> {
  const endpoints = [
    // Custom post type "eventos" (mais provável)
    `${BASE}/wp-json/wp/v2/eventos?per_page=100&_embed&orderby=date&order=asc`,
    // The Events Calendar plugin
    `${BASE}/wp-json/tribe/events/v1/events?per_page=100&start_date=now`,
    // Posts normais com categoria "eventos"
    `${BASE}/wp-json/wp/v2/posts?per_page=100&_embed&search=evento`,
    // Posts normais genéricos (último recurso API)
    `${BASE}/wp-json/wp/v2/posts?per_page=50&_embed`,
  ];

  for (const url of endpoints) {
    try {
      console.log(`  🔍 Tentando: ${url.replace(BASE, '')}`);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        console.log(`    ❌ HTTP ${res.status}`);
        continue;
      }

      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) {
        console.log(`    ❌ Não é JSON: ${ct}`);
        continue;
      }

      const data = await res.json();

      // The Events Calendar devolve { events: [...] }
      const items = Array.isArray(data) ? data : data?.events;
      if (!items || items.length === 0) {
        console.log('    ❌ Sem resultados');
        continue;
      }

      console.log(`    ✅ ${items.length} items encontrados`);
      return items.map(parseAPIEvent).filter((e): e is Event => e !== null);
    } catch (err) {
      console.log(`    ❌ Erro: ${(err as Error).message}`);
      continue;
    }
  }

  return null;
}

function parseAPIEvent(item: any): Event | null {
  const title = stripHTML(item.title?.rendered || item.title || '');
  if (!title) return null;

  // Detectar formato (The Events Calendar vs WP standard)
  const isTribal = !!item.start_date;
  const rawDate = isTribal ? item.start_date : item.date;
  const date = parseToISO(rawDate);
  if (!date) return null;

  const desc = stripHTML(
    item.description || item.content?.rendered || item.excerpt?.rendered || ''
  ).slice(0, 500);

  const img = item.image?.url
    || item._embedded?.['wp:featuredmedia']?.[0]?.source_url
    || '';

  const link = item.url || item.link || '';
  const loc = item.venue?.venue || extractLocation(desc) || 'Barreiro';
  const cat = item.categories?.[0]?.name
    || item._embedded?.['wp:term']?.[0]?.[0]?.name
    || inferCategory(title + ' ' + desc);

  return {
    id: `cmb-${item.id || hashStr(title + date)}`,
    title,
    description: desc,
    date,
    endDate: isTribal && item.end_date ? parseToISO(item.end_date) : undefined,
    time: extractTime(rawDate),
    location: loc,
    category: cat,
    imageUrl: img || undefined,
    sourceUrl: link,
    tags: extractTags(item),
    scrapedAt: new Date().toISOString(),
  };
}

// ─── Estratégia 4-5: HTML Scraping ───
async function scrapeHTML(): Promise<Event[]> {
  const events: Event[] = [];

  // Scrape da homepage (tem widget de agenda com dados reais)
  try {
    const homeEvents = await scrapeHomepage();
    events.push(...homeEvents);
  } catch (e) {
    console.log(`  ❌ Homepage: ${(e as Error).message}`);
  }

  // Scrape da página de agenda
  try {
    const agendaEvents = await scrapeAgendaPage();
    events.push(...agendaEvents);
  } catch (e) {
    console.log(`  ❌ Agenda: ${(e as Error).message}`);
  }

  // Deduplicar
  return dedup(events);
}

async function scrapeHomepage(): Promise<Event[]> {
  console.log('  📄 Scraping homepage...');
  const res = await fetch(BASE, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const $ = cheerio.load(await res.text());
  const events: Event[] = [];

  // Procurar no widget de agenda da homepage
  // Padrão observado: "24 Janeiro - 15 Março 2026 · Piscina Municipal do Barreiro"
  $('a[href*="/eventos/"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';
    const $parent = $a.closest('div, article, li, section');
    const text = $parent.text() || $a.text();
    const title = $a.find('h2, h3, h4, strong, .title').text().trim() || $a.text().trim();

    if (!title || title.length < 3) return;

    // Tentar extrair data do texto circundante
    const dateMatch = text.match(/(\d{1,2})\s+(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\s+(\d{4})/i);
    const date = dateMatch ? parsePTDate(dateMatch[1], dateMatch[2], dateMatch[3]) : null;

    // Extrair local
    const img = $parent.find('img').first().attr('src') || '';

    events.push({
      id: `cmb-${hashStr(title + (date || ''))}`,
      title,
      description: '',
      date: date || new Date().toISOString().split('T')[0],
      location: extractLocationFromText(text) || 'Barreiro',
      category: inferCategory(title),
      imageUrl: img ? (img.startsWith('/') ? `${BASE}${img}` : img) : undefined,
      sourceUrl: href.startsWith('/') ? `${BASE}${href}` : href,
      tags: [],
      scrapedAt: new Date().toISOString(),
    });
  });

  return events;
}

async function scrapeAgendaPage(): Promise<Event[]> {
  console.log('  📄 Scraping página de agenda...');
  const url = `${BASE}/conhecer/agenda-de-eventos/`;
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const $ = cheerio.load(await res.text());
  const events: Event[] = [];

  // Tentar vários seletores comuns
  const selectors = [
    '.event-item', '.evento', 'article', '.post-item',
    '.card', '[class*="event"]', '[class*="evento"]',
    '.agenda-item', '.tribe-events-calendar-list__event',
    '.entry', '.wp-block-post',
  ];

  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, h4, .title, .entry-title').first().text().trim();
      if (!title || title.length < 3 || title.length > 300) return;

      const link = $el.find('a[href*="/eventos/"]').first().attr('href')
        || $el.find('a').first().attr('href') || '';
      const dateText = $el.find('time, .date, [class*="date"], [class*="data"]').first().text().trim()
        || $el.find('time').attr('datetime') || '';
      const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
      const desc = $el.find('.excerpt, .description, p').first().text().trim();
      const loc = $el.find('.location, .local, [class*="local"]').first().text().trim();

      events.push({
        id: `cmb-${hashStr(title + dateText)}`,
        title,
        description: desc,
        date: parseToISO(dateText) || new Date().toISOString().split('T')[0],
        location: loc || 'Barreiro',
        category: inferCategory(title + ' ' + desc),
        imageUrl: img ? (img.startsWith('/') ? `${BASE}${img}` : img) : undefined,
        sourceUrl: link ? (link.startsWith('/') ? `${BASE}${link}` : link) : url,
        tags: [],
        scrapedAt: new Date().toISOString(),
      });
    });

    if (events.length > 0) break;
  }

  // Fallback: qualquer link para /eventos/
  if (events.length === 0) {
    $('a[href*="/eventos/"]').each((_, el) => {
      const $a = $(el);
      const title = $a.text().trim();
      const href = $a.attr('href') || '';
      if (title && title.length > 5 && title.length < 200) {
        events.push({
          id: `cmb-${hashStr(title)}`,
          title,
          description: '',
          date: new Date().toISOString().split('T')[0],
          location: 'Barreiro',
          category: inferCategory(title),
          sourceUrl: href.startsWith('/') ? `${BASE}${href}` : href,
          tags: [],
          scrapedAt: new Date().toISOString(),
        });
      }
    });
  }

  return events;
}

// ─── Utilitários ───

const MESES: Record<string, number> = {
  janeiro: 0, fevereiro: 1, março: 2, 'marco': 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};

function parsePTDate(day: string, month: string, year: string): string | null {
  const m = MESES[month.toLowerCase()];
  if (m === undefined) return null;
  const d = new Date(parseInt(year), m, parseInt(day));
  return d.toISOString().split('T')[0];
}

function parseToISO(input: string): string | null {
  if (!input) return null;
  // ISO já?
  const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  // "15 de março de 2026" ou "15 Março 2026"
  const pt = input.match(/(\d{1,2})\s+(?:de\s+)?(\w+)\s+(?:de\s+)?(\d{4})/i);
  if (pt) return parsePTDate(pt[1], pt[2], pt[3]);
  // "15/03/2026"
  const num = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (num) return `${num[3]}-${num[2].padStart(2, '0')}-${num[1].padStart(2, '0')}`;
  // Último recurso
  const d = new Date(input);
  return !isNaN(d.getTime()) && d.getFullYear() > 2000 ? d.toISOString().split('T')[0] : null;
}

function extractTime(s: string): string {
  const m = s.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : '';
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (/concert|music|música|fado|jazz|punk|rock|hip.hop|dj|disco/.test(t)) return 'Música';
  if (/festival|fest[\'ʼ ]|festas/.test(t)) return 'Festival';
  if (/teatro|theatre|peça|dramaturgia|comédia/.test(t)) return 'Teatro';
  if (/dança|dance|ballet|flamenc/.test(t)) return 'Dança';
  if (/cinema|filme|film|documentário|curta/.test(t)) return 'Cinema';
  if (/exposição|exhibition|galeria|fotografia|pintura|artes visuais/.test(t)) return 'Exposição';
  if (/workshop|oficina|ateliê|formação|curso/.test(t)) return 'Workshop';
  if (/livro|leitura|poesia|literatura|biblioteca|contos|clube.*leitura/.test(t)) return 'Literatura';
  if (/infantil|crianças|júnior|famíli|bebé|kids|hora do conto/.test(t)) return 'Infantil';
  if (/desporto|corrida|atletismo|futebol|natação|piscina|corta.mato/.test(t)) return 'Desporto';
  if (/visita|caminhada|passeio|percurso|patrimóni|guiad/.test(t)) return 'Visita';
  if (/ambiente|mata|machada|floresta|árvore|catos|formiga/.test(t)) return 'Ambiente';
  return 'Cultura';
}

function extractLocation(text: string): string {
  const locs = [
    'Auditório Municipal Augusto Cabrita', 'Biblioteca Municipal do Barreiro',
    'Cooperativa Mula', 'Mercado Municipal', 'Piscina Municipal',
    'Moinho de Maré', 'Galeria Municipal', 'PADA Studios',
    'Paços do Concelho', 'Espaço J',
  ];
  for (const loc of locs) {
    if (text.includes(loc)) return loc;
  }
  return '';
}

function extractLocationFromText(text: string): string {
  return extractLocation(text);
}

function extractTags(item: any): string[] {
  const tags: string[] = [];
  const terms = item._embedded?.['wp:term'];
  if (Array.isArray(terms)) {
    for (const group of terms) {
      if (Array.isArray(group)) {
        for (const t of group) {
          if (t.name) tags.push(t.name);
        }
      }
    }
  }
  return tags;
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function dedup(events: Event[]): Event[] {
  const seen = new Map<string, Event>();
  for (const e of events) {
    const key = e.title.toLowerCase().replace(/\s+/g, '').slice(0, 50) + '|' + e.date;
    if (!seen.has(key)) seen.set(key, e);
  }
  return Array.from(seen.values());
}