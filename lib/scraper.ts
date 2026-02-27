// lib/scraper.ts
// Scraper para https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/
// Os eventos actuais têm URLs com ?mp=7164&mc=8420
// e o texto do link contém a data + título

import { chromium, type Browser, type Page } from 'playwright';

export interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  endDate?: string;
  time?: string;
  location: string;
  price: string;
  description: string;
  descriptionFull: string;
  sourceUrl: string;
  imageUrl?: string;
  organizer?: string;
  contacts?: string;
  ticketUrl?: string;
  ageRating?: string;
  source: string;
  scrapedAt: string;
  featured?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────

const MONTHS_PT: Record<string, string> = {
  janeiro:'01', fevereiro:'02', 'março':'03', marco:'03', abril:'04',
  maio:'05', junho:'06', julho:'07', agosto:'08', setembro:'09',
  outubro:'10', novembro:'11', dezembro:'12',
};

function parseDatePT(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (!m) return null;
  const day = m[1].padStart(2, '0');
  const key = m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const month = MONTHS_PT[key];
  if (!month) return null;
  return `${m[3]}-${month}-${day}`;
}

function slug(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

const CAT_RULES: [RegExp, string][] = [
  [/concert|música|fado|zambujo|ivandro|tiago sousa|banda municipal|orquestra|jazz|hip.?hop/i, 'Música'],
  [/exposiç|ilustra|mostra|galeria|pintura|fotografia/i, 'Exposição'],
  [/dança|flamen|ballet|coreograf/i, 'Dança'],
  [/teatro|peça|dramatur|comédia|palco|espetáculo/i, 'Teatro'],
  [/trail|natação|atletismo|xadrez|desport|corta.?mato|torneio|circuito|piscina|corrida/i, 'Desporto'],
  [/oficina|workshop|curso|formação/i, 'Workshop'],
  [/visita|patrimon|roteiro|guiad/i, 'Visitas'],
  [/conto|leitura|livro|biblioteca|hora do conto/i, 'Leitura'],
  [/cinema|filme|sessão/i, 'Cinema'],
  [/feira|mercado|gastronom/i, 'Comunidade'],
];

function detectCat(text: string): string {
  for (const [re, cat] of CAT_RULES) if (re.test(text)) return cat;
  return 'Comunidade';
}

// ─── Main ───────────────────────────────────────────────────────

export async function scrapeEvents(): Promise<Event[]> {
  const BASE = 'https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/';
  let browser: Browser | null = null;

  try {
    console.log('🚀 A lançar browser...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });

    console.log('📄 A navegar para a agenda...');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

    // Aceitar cookies
    try {
      const btn = page.locator('text=Aceitar tudo');
      if (await btn.isVisible({ timeout: 3000 })) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    } catch {}

    await page.waitForTimeout(3000);

    // Scroll para carregar tudo
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(400);
    }

    // ─── Extrair links de eventos ACTUAIS ───
    // Os eventos reais têm ?mp= no URL e o texto contém data + título
    console.log('🔍 A extrair eventos da agenda...');
    const rawItems = await page.evaluate(() => {
      const items: { href: string; text: string; img: string }[] = [];
      // Seleccionar links que são eventos actuais (contêm ?mp= ou estão em /eventos/ com data)
      const allLinks = document.querySelectorAll('a[href*="/eventos/"]');
      const seen = new Set<string>();

      allLinks.forEach(a => {
        const el = a as HTMLAnchorElement;
        const href = el.href;
        // Filtrar: só eventos com query params (são os da agenda actual)
        // OU eventos em /eventos/ que não sejam sub-páginas de arquivo
        const url = new URL(href);
        const isAgendaEvent = url.search.includes('mp=');
        const isDirectEvent = url.pathname.match(/^\/eventos\/[^/]+\/?$/) && !url.pathname.includes('feira-quinhentista') && !url.pathname.includes('festas-do-barreiro') && !url.pathname.includes('provocacao') && !url.pathname.includes('moinho-lounge');

        if (!isAgendaEvent && !isDirectEvent) return;

        // Deduplicate by pathname
        const key = url.pathname;
        if (seen.has(key)) return;
        seen.add(key);

        const text = el.textContent || '';
        // Procurar imagem no card pai
        const card = el.closest('li, article, .event, .card, div') || el;
        const imgEl = card.querySelector('img');
        const img = imgEl ? imgEl.src : '';

        items.push({ href, text: text.trim(), img });
      });
      return items;
    });

    console.log(`📦 Encontrados ${rawItems.length} eventos na agenda`);

    if (rawItems.length === 0) {
      console.log('⚠️ Nenhum evento encontrado na agenda. A página pode ter mudado.');
      return [];
    }

    // ─── Visitar cada página de evento para extrair detalhes ───
    const events: Event[] = [];

    for (const item of rawItems) {
      try {
        console.log(`  → A extrair: ${item.text.slice(0, 60).replace(/\s+/g, ' ')}...`);
        const ev = await scrapeDetail(page, item);
        if (ev) {
          events.push(ev);
          console.log(`    ✓ ${ev.title} (${ev.date})`);
        }
      } catch (err: any) {
        console.warn(`    ✗ Erro: ${err.message}`);
      }
    }

    // Marcar o primeiro evento futuro como destaque
    const today = new Date().toISOString().slice(0, 10);
    const future = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    if (future.length > 0) future[0].featured = true;

    console.log(`\n✅ ${events.length} eventos extraídos com sucesso`);
    return events;

  } catch (err) {
    console.error('❌ Scraping falhou:', err);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

// ─── Detalhe de cada evento ─────────────────────────────────────

async function scrapeDetail(page: Page, item: { href: string; text: string; img: string }): Promise<Event | null> {
  // Extrair data do texto do link (ex: "25 Janeiro 2026 - 7 Junho 2026\n...Circuito de Torneios...")
  const dateMatch = item.text.match(/(\d{1,2}\s+\w+\s+\d{4})/g);
  const listDate = dateMatch?.[0] ? parseDatePT(dateMatch[0]) : null;
  const listEndDate = dateMatch?.[1] ? parseDatePT(dateMatch[1]) : null;

  await page.goto(item.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    // Título — h1 principal, limpar "Atualizado em..."
    const h1Raw = document.querySelector('h1')?.textContent?.trim() || '';
    const title = h1Raw.replace(/\s*Atualizado em.*/i, '').replace(/\s+/g, ' ').trim();

    // Conteúdo principal
    const main = document.querySelector('.entry-content, .event-content, article .content, main article, .post-content');
    const body = main || document.querySelector('main') || document.body;
    const fullText = body.innerText || '';

    // Parágrafos limpos para descrição
    const ps = body.querySelectorAll('p');
    const paragraphs = Array.from(ps)
      .map(p => (p.textContent || '').trim())
      .filter(t => t.length > 20 && !t.includes('Procurar') && !t.includes('Tipo de conteúdo') && !t.includes('Selecionar'));
    const descFull = paragraphs.join('\n\n').slice(0, 3000);
    const descShort = paragraphs[0]?.slice(0, 300) || '';

    // Datas no conteúdo
    const dateMatches = fullText.match(/(\d{1,2}\s+(?:de\s+)?\w+\s+(?:de\s+)?\d{4})/gi) || [];

    // Hora
    const timeMatch = fullText.match(/(\d{1,2})[hH:](\d{2})/);
    const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '';

    // Localização — procurar padrões comuns
    const locPatterns = [
      /(?:Local|Onde|Venue)[:\s]+([^\n]+)/i,
      /(Auditório[^.\n,]{0,60})/i,
      /(Piscina[^.\n,]{0,60})/i,
      /(Biblioteca[^.\n,]{0,60})/i,
      /(Mercado[^.\n,]{0,60})/i,
      /(Parque[^.\n,]{0,60})/i,
      /(Mata[^.\n,]{0,60})/i,
      /(Galeria[^.\n,]{0,60})/i,
      /(Pavilhão[^.\n,]{0,60})/i,
      /(AMAC[^.\n,]{0,60})/i,
    ];
    let location = '';
    for (const re of locPatterns) {
      const m = fullText.match(re);
      if (m) { location = m[1]?.trim() || m[0]?.trim(); break; }
    }

    // Preço
    const priceMatch = fullText.match(/gratuito|entrada\s+livre|€\s*\d+[,.]?\d*/i);
    const price = priceMatch ? (/gratuito|livre/i.test(priceMatch[0]) ? 'Gratuito' : priceMatch[0]) : '';

    // Imagem — og:image ou primeira imagem do conteúdo
    const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    const contentImg = body.querySelector('img:not([src*="logo"])')?.getAttribute('src') || '';
    const imageUrl = ogImg || contentImg;

    // Organizador
    const orgMatch = fullText.match(/(?:Organização|Org\.|Promoção)[:\s]+([^\n]{3,60})/i);
    const organizer = orgMatch ? orgMatch[1].trim() : '';

    // Contactos
    const phones = fullText.match(/(?:2\d{2}\s?\d{3}\s?\d{3}|9\d{2}\s?\d{3}\s?\d{3})/g) || [];
    const emails = fullText.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
    const contacts = [...phones, ...emails].join(' · ');

    // Bilheteira
    const ticketEl = body.querySelector('a[href*="ticketline"], a[href*="bilhete"], a[href*="xistarca"], a[href*="inscrição"], a[href*="inscricao"]') as HTMLAnchorElement;
    const ticketUrl = ticketEl?.href || '';

    // Classificação etária
    const ageMatch = fullText.match(/M\/(\d+)\s*anos/i);
    const ageRating = ageMatch ? `M/${ageMatch[1]} anos` : '';

    return {
      title, descShort, descFull, time, location, price, imageUrl,
      organizer, contacts, ticketUrl, ageRating,
      dates: dateMatches.slice(0, 4),
    };
  });

  if (!data.title || data.title.length < 3) return null;

  // Usar data da listagem (mais fiável) ou da página de detalhe
  const date = listDate || (data.dates[0] ? parseDatePT(data.dates[0]) : null) || new Date().toISOString().slice(0, 10);
  const endDate = listEndDate || (data.dates[1] ? parseDatePT(data.dates[1]) : undefined);

  return {
    id: `${slug(data.title)}-${date}`,
    title: data.title,
    category: detectCat(`${data.title} ${data.descShort}`),
    date,
    endDate,
    time: data.time || undefined,
    location: data.location || 'Barreiro',
    price: data.price,
    description: data.descShort,
    descriptionFull: data.descFull,
    sourceUrl: item.href.split('?')[0],
    imageUrl: data.imageUrl || item.img || undefined,
    organizer: data.organizer || undefined,
    contacts: data.contacts || undefined,
    ticketUrl: data.ticketUrl || undefined,
    ageRating: data.ageRating || undefined,
    source: 'cm-barreiro.pt',
    scrapedAt: new Date().toISOString(),
  };
}