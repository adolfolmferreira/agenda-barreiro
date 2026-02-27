// lib/scrapers/outra.ts
// Scraper para https://outra.pt/
//
// A OUT.RA é uma associação cultural que organiza o OUT.FEST
// e programação regular na Cooperativa Mula, ADAO, SIRB Penicheiros, etc.
//
// Estratégia:
// 1. Tenta WP REST API (o site parece ser WordPress)
// 2. Tenta feed RSS/Atom
// 3. Scraping HTML da página de eventos

import * as cheerio from 'cheerio';
import type { RawEvent } from './types';

const BASE_URL = 'https://outra.pt';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
};

// === Estratégia 1: WP REST API ===
async function tryAPI(): Promise<RawEvent[] | null> {
  const endpoints = [
    `${BASE_URL}/wp-json/wp/v2/posts?per_page=20&_embed`,
    `${BASE_URL}/wp-json/tribe/events/v1/events?per_page=20`,
    `${BASE_URL}/wp-json/wp/v2/events?per_page=20&_embed`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { ...HEADERS, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.events;
      if (!items?.length) continue;

      console.log(`  ✅ OUT.RA API encontrada: ${url}`);
      return items.map((p: any) => ({
        title: p.title?.rendered || p.title || '',
        description: stripHTML(p.content?.rendered || p.excerpt?.rendered || p.description || ''),
        date: p.start_date || p.date || '',
        endDate: p.end_date || '',
        time: p.start_date ? extractTime(p.start_date) : '',
        location: p.venue?.venue || 'Barreiro',
        category: inferCategory(p.title?.rendered || p.title || ''),
        imageUrl: p.image?.url || p._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
        sourceUrl: p.url || p.link || '',
        source: 'outra' as const,
        tags: p.tags?.map((t: any) => t.name || t) || ['out.ra'],
      }));
    } catch {
      continue;
    }
  }
  return null;
}

// === Estratégia 2: Feed RSS ===
async function tryRSS(): Promise<RawEvent[] | null> {
  const feedUrls = [
    `${BASE_URL}/feed/`,
    `${BASE_URL}/rss/`,
    `${BASE_URL}/feed/rss2/`,
  ];

  for (const url of feedUrls) {
    try {
      const res = await fetch(url, {
        headers: { ...HEADERS, Accept: 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const xml = await res.text();
      if (!xml.includes('<rss') && !xml.includes('<feed')) continue;

      console.log(`  ✅ OUT.RA RSS encontrado: ${url}`);
      const $ = cheerio.load(xml, { xmlMode: true });
      const events: RawEvent[] = [];

      $('item').each((_, el) => {
        const $el = $(el);
        const title = $el.find('title').text().trim();
        if (!title) return;

        // Extrair imagem do content:encoded ou description
        const content = $el.find('content\\:encoded').text() || $el.find('description').text();
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)/);

        events.push({
          title,
          description: stripHTML(content).slice(0, 500),
          date: $el.find('pubDate').text() || '',
          location: 'Barreiro',
          category: inferCategory(title),
          imageUrl: imgMatch?.[1] || '',
          sourceUrl: $el.find('link').text().trim() || '',
          source: 'outra',
          tags: ['out.ra'],
        });
      });

      if (events.length > 0) return events;
    } catch {
      continue;
    }
  }
  return null;
}

// === Estratégia 3: HTML Scraping ===
async function scrapeHTML(): Promise<RawEvent[]> {
  console.log('  📄 Scraping HTML do OUT.RA...');

  // Tentar várias páginas do site
  const pages = [
    `${BASE_URL}/`,
    `${BASE_URL}/programacao/`,
    `${BASE_URL}/eventos/`,
    `${BASE_URL}/agenda/`,
    `${BASE_URL}/eng/`,
  ];

  for (const pageUrl of pages) {
    try {
      const res = await fetch(pageUrl, {
        headers: HEADERS,
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);
      const events: RawEvent[] = [];

      // Procurar posts/cards de eventos
      const selectors = [
        'article', '.post', '.event', '.programa',
        '.entry', '.card', '[class*="event"]',
        '.elementor-post', '.jet-listing-grid__item',
      ];

      for (const sel of selectors) {
        $(sel).each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, h4, .title, .entry-title, .post-title').first().text().trim();
          if (!title || title.length < 3) return;

          const link = $el.find('a').first().attr('href') || '';
          const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
          const dateText = $el.find('time, .date, .data, [class*="date"]').first().text().trim()
            || $el.find('time').attr('datetime') || '';
          const desc = $el.find('.excerpt, .description, p').first().text().trim();

          events.push({
            title,
            description: desc,
            date: dateText,
            location: 'Barreiro',
            category: inferCategory(title),
            imageUrl: img,
            sourceUrl: link.startsWith('/') ? `${BASE_URL}${link}` : link,
            source: 'outra',
            tags: ['out.ra'],
          });
        });

        if (events.length > 0) break;
      }

      if (events.length > 0) {
        console.log(`  ✅ Encontrados ${events.length} eventos em ${pageUrl}`);
        return events;
      }
    } catch {
      continue;
    }
  }

  return [];
}

// === Função principal ===
export async function scrapeOutra(): Promise<RawEvent[]> {
  console.log('🎵 Scraping OUT.RA...');

  const apiEvents = await tryAPI();
  if (apiEvents && apiEvents.length > 0) return apiEvents;

  const rssEvents = await tryRSS();
  if (rssEvents && rssEvents.length > 0) return rssEvents;

  console.log('  ⚠️ API e RSS não disponíveis, usando HTML...');
  return scrapeHTML();
}

// === Utilitários ===
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractTime(dateStr: string): string {
  const m = dateStr.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : '';
}

function inferCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('concerto') || t.includes('concert') || t.includes('music') || t.includes('música') || t.includes('dj')) return 'música';
  if (t.includes('fest') || t.includes('festival')) return 'festival';
  if (t.includes('teatro') || t.includes('theatre')) return 'teatro';
  if (t.includes('dança') || t.includes('dance')) return 'dança';
  if (t.includes('cinema') || t.includes('filme') || t.includes('film')) return 'cinema';
  if (t.includes('exposição') || t.includes('exhibition') || t.includes('galeria')) return 'exposição';
  if (t.includes('workshop') || t.includes('oficina') || t.includes('ateliê')) return 'workshop';
  if (t.includes('residência') || t.includes('residency')) return 'música';
  return 'outro';
}