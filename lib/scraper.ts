// lib/scraper.ts — v7
// Scraper com paginação completa via Playwright + fetch para páginas individuais

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

const MP: Record<string, string> = {
  janeiro:'01', fevereiro:'02', 'março':'03', marco:'03', abril:'04',
  maio:'05', junho:'06', julho:'07', agosto:'08', setembro:'09',
  outubro:'10', novembro:'11', dezembro:'12',
};

function parsePT(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+(?:de\s+)?(\w+)\s+(?:de\s+)?(\d{4})/i);
  if (!m) return null;
  const k = m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mo = MP[k];
  return mo ? `${m[3]}-${mo}-${m[1].padStart(2, '0')}` : null;
}

function slug(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

const CR: [RegExp, string][] = [
  [/concert|música|fado|zambujo|ivandro|jazz|hip.?hop|punk|banda/i, 'Música'],
  [/exposiç|ilustra|mostra|galeria|pintura|fotografia/i, 'Exposição'],
  [/dança|flamen|ballet|coreograf/i, 'Dança'],
  [/teatro|peça|dramatur|comédia|palco|espetáculo|marioneta/i, 'Teatro'],
  [/trail|natação|natacao|atletismo|xadrez|desport|corta.?mato|torneio|circuito|piscina|corrida|festival de bebé|walking.?football|aqua|meeting/i, 'Desporto'],
  [/oficina|workshop|curso|formação|treinador|masterclass/i, 'Workshop'],
  [/visita|patrimon|roteiro|guiad/i, 'Visitas'],
  [/conto|leitura|livro|biblioteca|hora do conto|clube de leitura/i, 'Leitura'],
  [/cinema|filme|sessão/i, 'Cinema'],
  [/carnaval|feira|mercado|gastronom|festas|projeto|desfile|baile|namorados/i, 'Comunidade'],
];

function cat(text: string): string {
  for (const [re, c] of CR) if (re.test(text)) return c;
  return 'Comunidade';
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'").replace(/&#8220;|&#8221;/g, '"').replace(/\s+/g, ' ').trim();
}

function between(html: string, start: RegExp, end: RegExp): string {
  const s = html.match(start);
  if (!s) return '';
  const rest = html.slice(s.index! + s[0].length);
  const e = rest.match(end);
  return e ? rest.slice(0, e.index) : rest.slice(0, 5000);
}

// ─── Fetch & parse a single event page ──────────────────────────

async function fetchEvent(url: string): Promise<Event | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'Accept-Language': 'pt-PT,pt;q=0.9' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const h1Raw = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
    const title = strip(h1Raw).replace(/\s*Atualizado em.*/i, '').trim();
    if (!title || title.length < 3) return null;

    const ogImg = html.match(/property="og:image"[^>]+content="([^"]+)"/)?.[1]
      || html.match(/content="([^"]+)"[^>]+property="og:image"/)?.[1] || '';

    const ldMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    let ld: any = null;
    if (ldMatch) try { ld = JSON.parse(ldMatch[1]); } catch {}

    const contentHtml = between(html, /class="[^"]*entry-content[^"]*"/i, /<\/article|<footer/i)
      || between(html, /<h1/i, /<footer/i);
    const contentText = strip(contentHtml);

    const dates = contentText.match(/(\d{1,2}\s+(?:de\s+)?\w+\s+(?:de\s+)?\d{4})/gi) || [];
    const date = (dates[0] ? parsePT(dates[0]) : null)
      || (ld?.startDate ? ld.startDate.slice(0, 10) : null)
      || new Date().toISOString().slice(0, 10);
    const endDate = (dates[1] ? parsePT(dates[1]) : null)
      || (ld?.endDate ? ld.endDate.slice(0, 10) : undefined);

    const timeM = contentText.match(/(\d{1,2})[hH:](\d{2})/);
    const time = timeM ? `${timeM[1].padStart(2, '0')}:${timeM[2]}` : undefined;

    const locPatterns = [
      /(?:Local|Onde)[:\s]+([^\n.]{5,60})/i,
      /(Auditório[^.\n,]{0,50})/i, /(Piscina[^.\n,]{0,50})/i,
      /(Biblioteca[^.\n,]{0,50})/i, /(Mercado[^.\n,]{0,50})/i,
      /(Mata[^.\n,]{0,50})/i, /(Parque[^.\n,]{0,50})/i,
      /(Pavilhão[^.\n,]{0,50})/i, /(Espaço J[^.\n,]{0,30})/i,
    ];
    let location = '';
    for (const re of locPatterns) {
      const m = contentText.match(re);
      if (m) { location = (m[1] || m[0]).trim(); break; }
    }
    if (!location) location = 'Barreiro';

    const priceM = contentText.match(/gratuito|entrada\s+livre|€\s*\d+[,.]?\d*/i);
    const price = priceM ? (/gratuito|livre/i.test(priceM[0]) ? 'Gratuito' : priceM[0]) : '';

    const paragraphs = contentHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const cleanPs = paragraphs.map(p => strip(p)).filter(t => t.length > 15 && !/Procurar|Selecionar|Tipo de conteúdo|cookies/i.test(t));
    const descFull = cleanPs.join('\n\n').slice(0, 3000);
    const desc = cleanPs[0]?.slice(0, 300) || '';

    const orgM = contentText.match(/Org\.?[:\s]*(CMB[^\n.]{0,50}|Câmara[^\n.]{0,50}|[^\n.]{3,50})/i);
    const organizer = orgM ? orgM[1].trim() : undefined;

    const phones = contentText.match(/(?:2\d{2}\s?\d{3}\s?\d{3}|9\d{2}\s?\d{3}\s?\d{3})/g) || [];
    const emails = contentText.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
    const contacts = [...phones, ...emails].filter(c => !c.includes('cm-barreiro')).join(' · ') || undefined;

    const ticketM = contentHtml.match(/href="([^"]*(?:ticketline|xistarca|bilhete|inscri)[^"]*)"/i);
    const ticketUrl = ticketM ? ticketM[1] : undefined;

    const ageM = contentText.match(/M\/(\d+)\s*anos/i);
    const ageRating = ageM ? `M/${ageM[1]} anos` : undefined;

    const cleanUrl = url.split('?')[0];

    return {
      id: `${slug(title)}-${date}`,
      title, category: cat(`${title} ${desc}`),
      date, endDate, time, location, price,
      description: desc, descriptionFull: descFull,
      sourceUrl: cleanUrl,
      imageUrl: ogImg || undefined,
      organizer, contacts, ticketUrl, ageRating,
      source: 'cm-barreiro.pt',
      scrapedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.warn(`  ✗ ${url.split('/eventos/')[1]?.slice(0, 40)} — ${err.message.slice(0, 50)}`);
    return null;
  }
}

// ─── Discover ALL URLs via pagination ───────────────────────────

async function discoverAllUrls(): Promise<string[]> {
  const { chromium } = await import('playwright');
  console.log('🔍 A descobrir eventos com paginação (Playwright)...\n');
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto('https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/', {
    waitUntil: 'networkidle', timeout: 20000,
  });

  // Dismiss cookies
  try { await p.locator('text=Aceitar tudo').click({ timeout: 2000 }); } catch {}
  await p.waitForTimeout(3000);

  const allUrls = new Set<string>();
  let pageNum = 1;
  const MAX_PAGES = 50; // safety limit

  while (pageNum <= MAX_PAGES) {
    // Scroll to load lazy content
    for (let i = 0; i < 3; i++) {
      await p.mouse.wheel(0, 500);
      await p.waitForTimeout(200);
    }

    // Extract event URLs from current page
    const urls = await p.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/eventos/"]');
      const result: string[] = [];
      links.forEach(a => {
        const href = (a as HTMLAnchorElement).href.split('?')[0];
        const u = new URL(href);
        if (u.pathname.match(/^\/eventos\/[^/]+\/?$/)) result.push(href);
      });
      return result;
    });

    const newCount = urls.filter(u => !allUrls.has(u)).length;
    urls.forEach(u => allUrls.add(u));
    console.log(`  📄 Página ${pageNum}: ${urls.length} links (${newCount} novos) — total: ${allUrls.size}`);

    // If no new URLs found, we might be looping
    if (newCount === 0 && pageNum > 2) {
      console.log('  ⏹ Sem novos URLs, a parar');
      break;
    }

    // Try clicking next page button
    const nextBtn = await p.$('button.pag-001-next:not(.pag-arrow--disabled)');
    if (!nextBtn) {
      console.log('  ⏹ Última página alcançada');
      break;
    }

    await nextBtn.click();
    await p.waitForTimeout(2500);
    pageNum++;
  }

  await b.close();
  console.log(`\n📦 ${allUrls.size} URLs totais descobertos em ${pageNum} páginas`);
  return Array.from(allUrls);
}

// ─── Main scraper ───────────────────────────────────────────────

export async function scrapeEvents(): Promise<Event[]> {
  console.log('═══════════════════════════════════════');
  console.log('  Agenda Barreiro — Scraper v7');
  console.log('  Paginação completa + fetch');
  console.log('═══════════════════════════════════════\n');

  // 1. Discover all URLs via pagination
  const allDiscovered = await discoverAllUrls();

  // 2. Filter: only keep events with 2025/2026 in URL or no year (current)
  const currentYear = new Date().getFullYear();
  const urls = allDiscovered.filter(u => {
    const path = new URL(u).pathname;
    const yearMatch = path.match(/20(\d{2})/);
    if (!yearMatch) return true; // no year in URL = probably current
    const yr = 2000 + parseInt(yearMatch[1]);
    return yr >= currentYear - 1; // keep 2025 and 2026+
  });

  console.log(`\n📋 ${urls.length} URLs de eventos actuais (filtrados de ${allDiscovered.length})\n`);

  // 3. Fetch all event pages in parallel batches of 4
  const events: Event[] = [];
  for (let i = 0; i < urls.length; i += 4) {
    const batch = urls.slice(i, i + 4);
    const results = await Promise.all(batch.map(async url => {
      const ev = await fetchEvent(url);
      if (ev) {
        const icon = ev.date >= '2026-01-01' ? '✓' : '⚠';
        console.log(`  ${icon} ${ev.title.slice(0, 50)} (${ev.date})`);
      }
      return ev;
    }));
    for (const r of results) if (r) events.push(r);
  }

  // 4. Filter: only events with date in 2025-2026 range
  const filtered = events.filter(e => {
    const year = parseInt(e.date.slice(0, 4));
    return year >= currentYear - 1 && year <= currentYear + 1;
  });

  // 5. Sort by date
  filtered.sort((a, b) => a.date.localeCompare(b.date));

  // 6. Mark featured (next upcoming with image)
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = filtered.filter(e => (e.endDate || e.date) >= today);
  const feat = upcoming.find(e => e.imageUrl) || upcoming[0];
  if (feat) feat.featured = true;

  // 7. Deduplicate by slug
  const unique: Event[] = [];
  const seen = new Set<string>();
  for (const e of filtered) {
    const key = slug(e.title);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(e);
  }

  console.log(`\n✅ ${unique.length} eventos únicos extraídos`);
  return unique;
}