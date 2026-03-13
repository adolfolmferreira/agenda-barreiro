// lib/scraper.ts — v10

function decodeHtml(s: string): string {
  return s
    .replace(/&aacute;/g,'á').replace(/&eacute;/g,'é').replace(/&iacute;/g,'í')
    .replace(/&oacute;/g,'ó').replace(/&uacute;/g,'ú').replace(/&atilde;/g,'ã')
    .replace(/&otilde;/g,'õ').replace(/&ccedil;/g,'ç').replace(/&Aacute;/g,'Á')
    .replace(/&Eacute;/g,'É').replace(/&Iacute;/g,'Í').replace(/&Oacute;/g,'Ó')
    .replace(/&Uacute;/g,'Ú').replace(/&Atilde;/g,'Ã').replace(/&Otilde;/g,'Õ')
    .replace(/&Ccedil;/g,'Ç').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ')
    .replace(/&euro;/g,'€').replace(/&ldquo;/g,'"').replace(/&rdquo;/g,'"')
    .replace(/&ndash;/g,'–').replace(/&mdash;/g,'—').replace(/&hellip;/g,'…')
    .replace(/&ordm;/g,'º').replace(/&#8211;/g,'–').replace(/&#8220;/g,'"')
    .replace(/&#8221;/g,'"').replace(/&#8230;/g,'…');
}

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
  janeiro:'01', jan:'01',
  fevereiro:'02', fev:'02',
  'março':'03', marco:'03', mar:'03',
  abril:'04', abr:'04',
  maio:'05', mai:'05',
  junho:'06', jun:'06',
  julho:'07', jul:'07',
  agosto:'08', ago:'08',
  setembro:'09', set:'09',
  outubro:'10', out:'10',
  novembro:'11', nov:'11',
  dezembro:'12', dez:'12',
};

function parsePT(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+(?:de\s+)?(\w+)\s+(?:de\s+)?(\d{4})/i);
  if (!m) return null;
  const k = m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mo = MP[k];
  return mo ? `${m[3]}-${mo}-${m[1].padStart(2, '0')}` : null;
}

function parseShortPT(text: string): string | null {
  const m = text.match(/(?:dia|manhã de|tarde de|noite de|próximo dia)\s+(\d{1,2})\s+(?:de\s+)?(\w+)/i);
  if (!m) return null;
  const k = m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mo = MP[k];
  return mo ? `2026-${mo}-${m[1].padStart(2, '0')}` : null;
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

function cat(text: string, title: string = ''): string {
  // Title-based overrides (highest priority)
  if (/oficina|workshop/i.test(title)) return 'Workshop';
  if (/teatro|marioneta|comédia|peça/i.test(title)) return 'Teatro';
  if (/exposiç|mostra/i.test(title)) return 'Exposição';
  if (/concert|fado|zambujo|ivandro/i.test(title)) return 'Música';
  if (/dança|flamen|ballet/i.test(title)) return 'Dança';
  // Fallback to full text matching
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

function dateFromImageUrl(imgUrl: string): string | null {
  // Only match full YYYY-MM-DD (not just YYYY/MM from uploads path)
  const m1 = imgUrl.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  return null;
}

function dateFromImageShort(imgUrl: string): string | null {
  const m = imgUrl.match(/[_-](\d{1,2})(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)(\d{2})/i);
  if (!m) return null;
  const moMap: Record<string, string> = {
    jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',
    jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12'
  };
  const mo = moMap[m[2].toLowerCase()];
  return mo ? `20${m[3]}-${mo}-${m[1].padStart(2, '0')}` : null;
}

function dateFromPageUrl(url: string): string | null {
  const path = new URL(url).pathname;
  const m = path.match(/(\d{1,2})-(?:de-)?(\w+)-(?:de-)?(20\d{2})/i);
  if (m) return parsePT(`${m[1]} ${m[2]} ${m[3]}`);
  const m2 = path.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
}

// ─── Fetch & parse a single event page ──────────────────────────

async function fetchEvent(url: string): Promise<Event | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'Accept-Language': 'pt-PT,pt;q=0.9' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // ─── Title ──────────────────────────────────────────────
    const h1Raw = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
    const title = strip(h1Raw).replace(/\s*Atualizado em.*/i, '').trim();
    if (!title || title.length < 3) return null;

    // ─── OG Image ───────────────────────────────────────────
    const ogImg = html.match(/property="og:image"[^>]+content="([^"]+)"/)?.[1]
      || html.match(/content="([^"]+)"[^>]+property="og:image"/)?.[1] || '';

    // ─── OG Description (reliable event text) ───────────────
    const ogDescRaw = html.match(/property="og:description"[^>]+content="([^"]+)"/i)?.[1]
      || html.match(/content="([^"]+)"[^>]+property="og:description"/i)?.[1] || '';
    const ogDesc = strip(ogDescRaw);

    // ─── LD+JSON ────────────────────────────────────────────
    const ldMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    let ld: any = null;
    if (ldMatch) try { ld = JSON.parse(ldMatch[1]); } catch {}

    // Also look for inline JSON with startDate/endDate
    const inlineJson = html.match(/\{"name":"[^"]*","startDate":"([^"]+)","endDate":"([^"]+)"/);
    if (inlineJson) {
      if (!ld) ld = {};
      ld.startDate = inlineJson[1];
      ld.endDate = inlineJson[2];
    }

    // ─── Content extraction (original v8 approach: h1 to footer) ──
    const contentHtml = between(html, /class="[^"]*entry-content[^"]*"/i, /<\/article|<footer/i)
      || between(html, /<h1/i, /<footer/i);
    const contentText = strip(contentHtml);

    // ─── Paragraphs / Description ───────────────────────────
    const paragraphs = contentHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const cleanPs = paragraphs.map(p => strip(p)).filter(t => t.length > 15 && !/Procurar|Selecionar|Tipo de conteúdo|cookies/i.test(t));
    const descFull = cleanPs.join('\n\n').slice(0, 3000) || ogDesc.slice(0, 3000);
    const desc = cleanPs[0]?.slice(0, 300) || ogDesc.slice(0, 300);

    // ─── DATE EXTRACTION (cascading fallbacks) ──────────────
    // Priority 1: LD+JSON
    const fixLdDate = (d: string | undefined): string | undefined => {
      if (!d) return undefined;
      const s = d.slice(0, 10);
      // Already YYYY-MM-DD
      if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
      // MM-DD-YYYY
      const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (m) return `${m[3]}-${m[1]}-${m[2]}`;
      return undefined;
    }
    const ldDate = fixLdDate(ld?.startDate);

    // Priority 2: og:description — most reliable event-specific text
    const ogDates = ogDesc.match(/(\d{1,2}\s+(?:de\s+)?\w+\s+(?:de\s+)?\d{4})/gi) || [];
    const parsedOgDate = ogDates[0] ? parsePT(ogDates[0]) : null;

    // Priority 3: og:description short pattern — "dia 7 de março" (no year)
    const shortOgDate = parseShortPT(ogDesc);

    // Priority 4: Content text (h1-to-footer, may include menu noise)
    const contentDates = contentText.match(/(\d{1,2}\s+(?:de\s+)?\w+\s+(?:de\s+)?\d{4})/gi) || [];
    const parsedContentDate = contentDates[0] ? parsePT(contentDates[0]) : null;

    // Priority 5: Image URL with full date — /2026-03-15-Oficina...
    const imgDate = ogImg ? dateFromImageUrl(ogImg) : null;

    // Priority 6: Image filename short — _16mar26.png
    const imgShortDate = ogImg ? dateFromImageShort(ogImg) : null;

    // Priority 7: Page URL
    const urlDate = dateFromPageUrl(url);

    // Priority 8: Today (last resort)
    const today = new Date().toISOString().slice(0, 10);
    const date = ldDate || parsedOgDate || shortOgDate || parsedContentDate || imgDate || imgShortDate || urlDate || today;

    // Try "até" pattern first for explicit end dates
    const ateMatch = contentText.match(/at[eé]\s+(\d{1,2}\s+(?:de\s+)?\w+\s+(?:de\s+)?\d{4})/i)
      || ogDesc.match(/at[eé]\s+(\d{1,2}\s+(?:de\s+)?\w+\s+(?:de\s+)?\d{4})/i);
    const endDate = (ateMatch ? parsePT(ateMatch[1]) : null)
      || (contentDates[1] ? parsePT(contentDates[1]) : null)
      || fixLdDate(ld?.endDate);

    // ─── Time ───────────────────────────────────────────────
    const timeM = contentText.match(/(\d{1,2})[hH:](\d{2})/) || ogDesc.match(/(\d{1,2})[hH:](\d{2})/);
    const time = timeM ? `${timeM[1].padStart(2, '0')}:${timeM[2]}` : undefined;

    // ─── Location ───────────────────────────────────────────
    const allText = contentText + ' ' + ogDesc;
    const locPatterns = [
      /(?:Local|Onde)[:\s]+([^\n.]{5,60})/i,
      /(Auditório[^.\n,]{0,50})/i, /(Piscina[^.\n,]{0,50})/i,
      /(Biblioteca[^.\n,]{0,50})/i, /(Mercado[^.\n,]{0,50})/i,
      /(Mata[^.\n,]{0,50})/i, /(Parque[^.\n,]{0,50})/i,
      /(Pavilhão[^.\n,]{0,50})/i, /(Espaço J[^.\n,]{0,30})/i,
      /(StartUp[^.\n,]{0,30})/i, /(Igreja[^.\n,]{0,50})/i,
      /(CEA[^.\n,]{0,60})/i, /(Campo de[^.\n,]{0,50})/i,
    ];
    let location = '';
    for (const re of locPatterns) {
      const m = allText.match(re);
      if (m) { location = (m[1] || m[0]).trim(); break; }
    }
    if (!location) location = 'Barreiro';

    // Sanitize location: cut at descriptive text
    location = location
      .split(/[?!…]/)[0]
      .replace(/\s+(Gostas|Vem|Uma|O |A |Em |Para|Com|De |Do |Da |No |Na |Às|Os |As |É |Se ).*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (location.length < 3) location = 'Barreiro';

    // ─── Price ──────────────────────────────────────────────
    const priceText = decodeHtml(allText);
    const priceM = priceText.match(/gratuito|entrada\s+livre|€\s*\d+[,.]?\d*|\d+[,.]?\d*\s*€|ingresso[:\s]+[^\n]{0,30}€[^\n]{0,10}|ingresso[:\s]+\d+[,.]?\d*\s*€/i);
    let price = '';
    if (priceM) {
      if (/gratuito|livre/i.test(priceM[0])) price = 'Gratuito';
      else {
        const euros = priceM[0].match(/(\d+[,.]?\d*)\s*€|€\s*(\d+[,.]?\d*)/);
        price = euros ? (euros[1] || euros[2]) + '€' : priceM[0].trim();
      }
    }

    // ─── Other metadata ─────────────────────────────────────
    const orgM = allText.match(/Org\.?[:\s]*(CMB[^\n.]{0,50}|Câmara[^\n.]{0,50}|[^\n.]{3,50})/i);
    const organizer = orgM ? orgM[1].trim() : undefined;

    const phones = allText.match(/(?:2\d{2}\s?\d{3}\s?\d{3}|9\d{2}\s?\d{3}\s?\d{3})/g) || [];
    const emails = allText.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
    const contacts = [...phones, ...emails].filter(c => !c.includes('cm-barreiro')).join(' · ') || undefined;

    const ticketM = contentHtml.match(/href="([^"]*(?:ticketline|xistarca|bilhete|inscri)[^"]*)"/i);
    const ticketUrl = ticketM ? ticketM[1] : undefined;

    const ageM = allText.match(/M\/(\d+)\s*anos/i);
    const ageRating = ageM ? `M/${ageM[1]} anos` : undefined;

    const cleanUrl = url.split('?')[0];

    return {
      id: `${slug(title)}-${date}`,
      title: decodeHtml(title), category: cat(`${title} ${desc}`, title),
      date, endDate, time, location: decodeHtml(location), price: price ? decodeHtml(price) : price,
      description: decodeHtml(desc), descriptionFull: decodeHtml(descFull),
      sourceUrl: cleanUrl,
      imageUrl: ogImg || undefined,
      organizer: organizer ? decodeHtml(organizer) : organizer,
      contacts, ticketUrl, ageRating,
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

  // Also fetch static HTML to catch links Playwright might miss
  try {
    const res = await fetch('https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/', {
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    const re2 = /href="(https?:\/\/www\.cm-barreiro\.pt\/eventos\/[^"?]+)"/gi;
    let m2: RegExpExecArray | null;
    let added = 0;
    while ((m2 = re2.exec(html)) !== null) {
      const url = m2[1];
      const clean = url.replace(/\/$/, '') + '/';
      if (!allUrls.has(clean) && clean.match(/^\/eventos\/[^/]+\/$/) === null) {
        allUrls.add(clean);
        added++;
      }
    }
    if (added > 0) console.log(`  📡 ${added} URLs extra do HTML estático`);
  } catch {}

  console.log(`\n📦 ${allUrls.size} URLs totais descobertos em ${pageNum} páginas`);
  return Array.from(allUrls);
}

// ─── Main scraper ───────────────────────────────────────────────

export async function scrapeEvents(): Promise<Event[]> {
  console.log('═══════════════════════════════════════');
  console.log('  Agenda Barreiro — Scraper v10');
  console.log('  og:description date + original content');
  console.log('═══════════════════════════════════════\n');

  const allDiscovered = await discoverAllUrls();

  const urls = allDiscovered.filter(u => {
    const path = new URL(u).pathname;
    const yearMatch = path.match(/20(\d{2})/);
    if (!yearMatch) return true;
    const yr = 2000 + parseInt(yearMatch[1]);
    return yr >= 2025;
  });

  console.log(`\n📋 ${urls.length} URLs de eventos actuais (filtrados de ${allDiscovered.length})\n`);

  const events: Event[] = [];
  for (let i = 0; i < urls.length; i += 3) {
    const batch = urls.slice(i, i + 3);
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

  const filtered = events.filter(e => {
    const year = parseInt(e.date.slice(0, 4));
    return year >= 2025 && year <= 2026;
  });

  filtered.sort((a, b) => a.date.localeCompare(b.date));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = filtered.filter(e => (e.endDate || e.date) >= today);
  const feat = upcoming.find(e => e.imageUrl) || upcoming[0];
  if (feat) feat.featured = true;

  const unique: Event[] = [];
  const seen = new Set<string>();
  for (const e of filtered) {
    const key = e.id;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(e);
  }

  const withToday = unique.filter(e => e.date === today).length;
  console.log(`\n✅ ${unique.length} eventos únicos extraídos`);
  if (withToday > 0) console.log(`⚠ ${withToday} eventos com data de hoje (fallback)`);

  const march = unique.filter(e => e.date.startsWith('2026-03'));
  if (march.length > 0) {
    console.log(`\n📅 Eventos de Março: ${march.length}`);
    march.forEach(e => console.log(`  → ${e.date} ${e.title.slice(0, 50)}`));
  }

  return unique;
}