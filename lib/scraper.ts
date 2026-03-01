// lib/scraper.ts — v8
// Scraper com paginação completa + fallback de data via URL da imagem

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

/** Extract YYYY-MM-DD from an image URL like /2026-03-15-Oficina... or /2026/03/image.jpg */
function dateFromImageUrl(imgUrl: string): string | null {
  // Pattern 1: /2026-03-15-Something or /2026-03-15_Something
  const m1 = imgUrl.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  // Pattern 2: /uploads/2026/03/
  const m2 = imgUrl.match(/uploads\/(20\d{2})\/(\d{2})\//);
  if (m2) return `${m2[1]}-${m2[2]}-01`;
  return null;
}

/** Extract YYYY-MM-DD from the page URL slug like /eventos/21-fevereiro-2026/ */
function dateFromPageUrl(url: string): string | null {
  const path = new URL(url).pathname;
  // Pattern: /14-marco-2026/ or /14-de-marco-de-2026/
  const m = path.match(/(\d{1,2})-(?:de-)?(\w+)-(?:de-)?(20\d{2})/i);
  if (m) return parsePT(`${m[1]} ${m[2]} ${m[3]}`);
  // Pattern: /2026-03-14-something/
  const m2 = path.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
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

    // ─── DATE EXTRACTION (cascading fallbacks) ──────────────
    // First try structured LD+JSON (most reliable when available)
    const ldDate = ld?.startDate ? ld.startDate.slice(0, 10) : null;

    // Then try content text for standard date patterns
    const dates = contentText.match(/(\d{1,2}\s+(?:de\s+)?\w+\s+(?:de\s+)?\d{4})/gi) || [];
    const parsedContentDate = dates[0] ? parsePT(dates[0]) : null;

    // Then try description paragraphs for patterns like "dia 21 de março de 2026",
    // "próximo dia 16 de março", "manhã de 7 de março"
    const descText = cleanPs.join(' ');
    const descDates = descText.match(/(\d{1,2}\s+(?:de\s+)?\w+\s+(?:de\s+)?\d{4})/gi) || [];
    const parsedDescDate = descDates[0] ? parsePT(descDates[0]) : null;

    // Also try short patterns in description: "dia 7 de março" (without year — assume 2026)
    let shortDescDate: string | null = null;
    if (!parsedDescDate) {
      const shortM = descText.match(/(?:dia|manhã de|tarde de|noite de)\s+(\d{1,2})\s+(?:de\s+)?(\w+)/i);
      if (shortM) {
        const k = shortM[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const mo = MP[k];
        if (mo) shortDescDate = `2026-${mo}-${shortM[1].padStart(2, '0')}`;
      }
    }

    // Try image URL and page URL
    const imgDate = ogImg ? dateFromImageUrl(ogImg) : null;
    const urlDate = dateFromPageUrl(url);

    // Also try short date in image filename: _16mar26.png
    let imgShortDate: string | null = null;
    if (ogImg) {
      const shortImgM = ogImg.match(/[_-](\d{1,2})(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)(\d{2})/i);
      if (shortImgM) {
        const moMap: Record<string, string> = {
          jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',
          jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12'
        };
        const mo = moMap[shortImgM[2].toLowerCase()];
        if (mo) imgShortDate = `20${shortImgM[3]}-${mo}-${shortImgM[1].padStart(2, '0')}`;
      }
    }

    // Use today ONLY as absolute last resort
    const today = new Date().toISOString().slice(0, 10);
    const date = ldDate || parsedContentDate || parsedDescDate || shortDescDate || imgDate || imgShortDate || urlDate || today;
    const usedFallback = date === today ? ' ⚠ FALLBACK' : '';

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

  try { await p.locator('text=Aceitar tudo').click({ timeout: 2000 }); } catch {}
  await p.waitForTimeout(3000);

  const allUrls = new Set<string>();
  let pageNum = 1;
  let noNewCount = 0;

  while (pageNum <= 30) {
    for (let i = 0; i < 3; i++) {
      await p.mouse.wheel(0, 500);
      await p.waitForTimeout(200);
    }

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

    if (newCount === 0) { noNewCount++; } else { noNewCount = 0; }
    if (noNewCount >= 3) {
      console.log('  ⏹ 3 páginas sem novos URLs, a parar');
      break;
    }

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
  console.log('  Agenda Barreiro — Scraper v8');
  console.log('  Paginação + image URL date fallback');
  console.log('═══════════════════════════════════════\n');

  const allDiscovered = await discoverAllUrls();

  // Filter: exclude obviously old events (2024 or earlier in URL)
  const urls = allDiscovered.filter(u => {
    const path = new URL(u).pathname;
    const yearMatch = path.match(/20(\d{2})/);
    if (!yearMatch) return true;
    const yr = 2000 + parseInt(yearMatch[1]);
    return yr >= 2025;
  });

  console.log(`\n📋 ${urls.length} URLs de eventos actuais (filtrados de ${allDiscovered.length})\n`);

  // Fetch all event pages in parallel batches of 4
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

  // Filter: only 2025-2026
  const filtered = events.filter(e => {
    const year = parseInt(e.date.slice(0, 4));
    return year >= 2025 && year <= 2026;
  });

  // Sort by date
  filtered.sort((a, b) => a.date.localeCompare(b.date));

  // Mark featured (next upcoming with image)
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = filtered.filter(e => (e.endDate || e.date) >= today);
  const feat = upcoming.find(e => e.imageUrl) || upcoming[0];
  if (feat) feat.featured = true;

  // Deduplicate by slug
  const unique: Event[] = [];
  const seen = new Set<string>();
  for (const e of filtered) {
    const key = slug(e.title);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(e);
  }

  // Log date source stats
  const withToday = unique.filter(e => e.date === today).length;
  console.log(`\n✅ ${unique.length} eventos únicos extraídos`);
  if (withToday > 0) console.log(`⚠ ${withToday} eventos ainda com data de hoje (fallback)`);

  // Log March events specifically
  const march = unique.filter(e => e.date.startsWith('2026-03'));
  if (march.length > 0) {
    console.log(`\n📅 Eventos de Março: ${march.length}`);
    march.forEach(e => console.log(`  → ${e.date} ${e.title.slice(0, 50)}`));
  }

  return unique;
}