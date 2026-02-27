// lib/scraper.ts
// Scraper automático para https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/
// Usa Playwright (browser headless) para renderizar a página e extrair eventos
// carregados via JavaScript/AJAX.
//
// Em produção (Vercel), usa @playwright/browser-chromium ou api routes com puppeteer-core + @sparticuz/chromium
// Em dev local, usa playwright completo.

import { chromium, type Browser, type Page } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

export interface Event {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  date: string;       // ISO YYYY-MM-DD
  endDate?: string;
  time?: string;
  location: string;
  price: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  scrapedAt: string;
}

// Category detection from title/description keywords
const CAT_RULES: [RegExp, string][] = [
  [/concert|música|fado|zambujo|ivandro|tiago sousa|banda municipal|orquestra|disco/i, 'Música'],
  [/exposiç|ilustra|mostra|galeria/i, 'Exposição'],
  [/dança|flamen|ballet|coreograf/i, 'Dança'],
  [/teatro|peça|dramatur|comédia|palco/i, 'Teatro'],
  [/trail|natação|atletismo|xadrez|desport|corta.?mato|torneio|circuito|piscina/i, 'Desporto'],
  [/oficina|workshop|curso|formação/i, 'Workshop'],
  [/visita|patrimon|roteiro|guiad/i, 'Visitas'],
  [/conto|leitura|livro|biblioteca|hora do conto/i, 'Leitura'],
];

function detectCategory(title: string, desc: string): string {
  const text = `${title} ${desc}`;
  for (const [re, cat] of CAT_RULES) {
    if (re.test(text)) return cat;
  }
  return 'Comunidade';
}

// Parse Portuguese date strings: "01 Março 2026", "1 Mar", "01 março", etc.
const MONTHS_PT: Record<string, string> = {
  janeiro:'01', fevereiro:'02', março:'03', marco:'03', abril:'04',
  maio:'05', junho:'06', julho:'07', agosto:'08', setembro:'09',
  outubro:'10', novembro:'11', dezembro:'12',
  jan:'01', fev:'02', mar:'03', abr:'04', mai:'05', jun:'06',
  jul:'07', ago:'08', set:'09', out:'10', nov:'11', dez:'12',
};

function parseDatePT(text: string, fallbackYear = 2026): string | null {
  // Try: "DD de Mês de YYYY" or "DD Mês YYYY" or "DD Mês"
  const m = text.match(/(\d{1,2})\s*(?:de\s+)?(\w+)(?:\s+(?:de\s+)?(\d{4}))?/i);
  if (!m) return null;
  const day = m[1].padStart(2, '0');
  const monthKey = m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // also try without accents
  const month = MONTHS_PT[monthKey] || MONTHS_PT[m[2].toLowerCase()];
  if (!month) return null;
  const year = m[3] || String(fallbackYear);
  return `${year}-${month}-${day}`;
}

function generateId(title: string, date: string): string {
  const slug = title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug}-${date}`;
}

// ─── Main scraper ───────────────────────────────────────────────

export async function scrapeEvents(): Promise<Event[]> {
  const url = 'https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/';
  let browser: Browser | null = null;

  try {
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set a realistic viewport and user agent
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
    });

    console.log(`📄 Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Accept cookies if the banner appears
    try {
      const cookieBtn = page.locator('text=Aceitar tudo');
      if (await cookieBtn.isVisible({ timeout: 3000 })) {
        await cookieBtn.click();
        console.log('🍪 Accepted cookies');
        await page.waitForTimeout(500);
      }
    } catch { /* no cookie banner */ }

    // Wait for events to load (they come via AJAX)
    console.log('⏳ Waiting for events to render...');
    await page.waitForTimeout(3000);

    // Scroll down to trigger lazy loading
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(500);
    }

    // Extract event data from the page
    console.log('🔍 Extracting events...');
    const raw = await page.evaluate(() => {
      const events: any[] = [];

      // Strategy 1: Look for event card/list elements
      // The CM Barreiro site typically renders events in a list with links to /eventos/
      const links = document.querySelectorAll('a[href*="/eventos/"]');
      const seen = new Set<string>();

      links.forEach(a => {
        const href = (a as HTMLAnchorElement).href;
        if (seen.has(href)) return;
        seen.add(href);

        // Get the closest container
        const card = a.closest('.evento, .event, .post, article, .card, li') || a;
        const title = card.querySelector('h2, h3, h4, .title, .titulo')?.textContent?.trim()
          || a.textContent?.trim() || '';
        if (!title || title.length < 3) return;

        // Try to find date, location, etc.
        const dateEl = card.querySelector('.date, .data, time, .event-date');
        const dateText = dateEl?.textContent?.trim() || '';
        const locEl = card.querySelector('.location, .local, .venue');
        const locText = locEl?.textContent?.trim() || '';
        const imgEl = card.querySelector('img');
        const imgSrc = imgEl?.src || '';

        events.push({ title, dateText, location: locText, url: href, imageUrl: imgSrc });
      });

      // Strategy 2: If no events found via links, try to read visible text blocks
      if (events.length === 0) {
        const allText = document.body.innerText;
        // Look for patterns like dates followed by venue names
        const blocks = allText.split(/\n\n+/);
        for (const block of blocks) {
          if (block.includes('Piscina') || block.includes('Auditório') ||
              block.includes('Biblioteca') || block.includes('Mercado') ||
              block.includes('Parque')) {
            events.push({ title: block.slice(0, 100), dateText: '', location: '', url: '', raw: block });
          }
        }
      }

      return events;
    });

    console.log(`📦 Found ${raw.length} raw events`);

    // Also scrape individual event pages for more detail
    const events: Event[] = [];
    const eventUrls = raw
      .filter((r: any) => r.url && r.url.includes('/eventos/'))
      .slice(0, 30); // Limit to 30 to avoid overload

    for (const item of eventUrls) {
      try {
        const ev = await scrapeEventDetail(page, item.url, item);
        if (ev) events.push(ev);
      } catch (err) {
        console.warn(`⚠️ Failed to scrape ${item.url}:`, err);
      }
    }

    // If we got events from the listing but couldn't get details, use listing data
    if (events.length === 0 && raw.length > 0) {
      for (const item of raw) {
        const date = parseDatePT(item.dateText || '') || '2026-01-01';
        events.push({
          id: generateId(item.title, date),
          title: item.title,
          subtitle: '',
          category: detectCategory(item.title, ''),
          date,
          location: item.location || 'Barreiro',
          price: '',
          description: '',
          url: item.url || url,
          imageUrl: item.imageUrl,
          source: 'cm-barreiro.pt',
          scrapedAt: new Date().toISOString(),
        });
      }
    }

    console.log(`✅ Scraped ${events.length} events`);
    return events;

  } catch (err) {
    console.error('❌ Scraping failed:', err);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

// ─── Scrape individual event page ──────────────────────────────

async function scrapeEventDetail(page: Page, url: string, listing: any): Promise<Event | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    const data = await page.evaluate(() => {
      const title = document.querySelector('h1, .entry-title, .event-title')?.textContent?.trim() || '';
      const content = document.querySelector('.entry-content, .event-content, article, main')?.textContent?.trim() || '';

      // Try to extract structured event data from JSON-LD
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      let structured: any = null;
      if (jsonLd) {
        try { structured = JSON.parse(jsonLd.textContent || ''); } catch {}
      }

      // Extract dates from the page content
      const datePatterns = content.match(/(\d{1,2}\s+(?:de\s+)?\w+(?:\s+(?:de\s+)?\d{4})?)/gi) || [];
      const timePattern = content.match(/(\d{1,2})[h:](\d{2})?/);
      const time = timePattern ? `${timePattern[1].padStart(2,'0')}:${timePattern[2]||'00'}` : '';

      // Look for price
      const priceMatch = content.match(/(?:€|EUR)\s*(\d+[,.]?\d*)|(\d+[,.]?\d*)\s*(?:€|EUR)|gratuito|entrada\s+livre/i);
      let price = '';
      if (priceMatch) {
        if (/gratuito|livre/i.test(priceMatch[0])) price = 'Gratuito';
        else price = '€' + (priceMatch[1] || priceMatch[2]);
      }

      // Location
      const locMatch = content.match(/(Auditório|Piscina|Biblioteca|Mercado|Parque|Moinho|Mata)[^.\n]*/i);
      const location = locMatch ? locMatch[0].trim() : '';

      const img = document.querySelector('.event-image img, .wp-post-image, article img');

      return {
        title,
        content: content.slice(0, 500),
        dates: datePatterns.slice(0, 3),
        time,
        price,
        location,
        imageUrl: (img as HTMLImageElement)?.src || '',
        structured,
      };
    });

    if (!data.title) return null;

    const date = (data.dates[0] ? parseDatePT(data.dates[0]) : null) || '2026-01-01';
    const endDate = data.dates[1] ? parseDatePT(data.dates[1]) : undefined;

    return {
      id: generateId(data.title, date),
      title: data.title,
      subtitle: '',
      category: detectCategory(data.title, data.content),
      date,
      endDate,
      time: data.time || undefined,
      location: data.location || listing?.location || 'Barreiro',
      price: data.price || '',
      description: data.content.slice(0, 300),
      url,
      imageUrl: data.imageUrl || listing?.imageUrl,
      source: 'cm-barreiro.pt',
      scrapedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── Store helpers ──────────────────────────────────────────────
// NOTA: loadEvents, saveEvents e getLastUpdated estão em lib/store.ts
// O scraper importa saveEvents de lá quando precisa de guardar dados.
// Isto evita que o Next.js tente carregar Playwright ao importar o store.