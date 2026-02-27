// lib/scrapers/cm-barreiro-agenda.ts
// Scraper para https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/
//
// Estratégia:
// 1. Tenta WP REST API (/wp-json/wp/v2/posts ou /wp-json/tribe/events/v1/events)
// 2. Se bloqueada, faz scraping do HTML com cheerio

import * as cheerio from 'cheerio';
import type { RawEvent } from './types';

const BASE_URL = 'https://www.cm-barreiro.pt';
const AGENDA_URL = `${BASE_URL}/conhecer/agenda-de-eventos/`;

// Headers para simular um browser normal
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
};

// === Estratégia 1: WP REST API ===
async function tryWPRestAPI(): Promise<RawEvent[] | null> {
  // Tenta The Events Calendar REST API (plugin popular para eventos WP)
  const endpoints = [
    `${BASE_URL}/wp-json/tribe/events/v1/events?per_page=50&start_date=now`,
    `${BASE_URL}/wp-json/wp/v2/posts?per_page=50&categories=eventos&_embed`,
    `${BASE_URL}/wp-json/wp/v2/events?per_page=50&_embed`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { ...HEADERS, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      if (!Array.isArray(data) && !data?.events) continue;

      const events = Array.isArray(data) ? data : data.events;
      if (!events?.length) continue;

      console.log(`  ✅ WP API encontrada: ${url}`);
      return events.map(parseWPEvent);
    } catch {
      continue;
    }
  }
  return null;
}

function parseWPEvent(post: any): RawEvent {
  // Formato The Events Calendar
  if (post.start_date) {
    return {
      title: post.title || post.title?.rendered || '',
      description: stripHTML(post.description || post.content?.rendered || ''),
      date: post.start_date,
      endDate: post.end_date,
      time: extractTime(post.start_date),
      location: post.venue?.venue || '',
      category: post.categories?.[0]?.name || '',
      imageUrl: post.image?.url || post.featured_media_url || '',
      sourceUrl: post.url || post.link || '',
      source: 'cm-barreiro-agenda',
      tags: post.tags?.map((t: any) => t.name) || [],
    };
  }

  // Formato WP standard
  return {
    title: post.title?.rendered || post.title || '',
    description: stripHTML(post.content?.rendered || post.excerpt?.rendered || ''),
    date: post.date || '',
    location: '',
    category: '',
    imageUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
    sourceUrl: post.link || '',
    source: 'cm-barreiro-agenda',
    tags: [],
  };
}

// === Estratégia 2: HTML Scraping ===
async function scrapeHTML(): Promise<RawEvent[]> {
  console.log('  📄 Fazendo scraping do HTML...');

  const res = await fetch(AGENDA_URL, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ao aceder ${AGENDA_URL}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const events: RawEvent[] = [];

  // A CM Barreiro usa tipicamente cards de eventos com classes como
  // .event-item, .agenda-item, .post-item, .card, etc.
  // Tentamos vários seletores comuns em sites WP municipais
  const selectors = [
    '.event-item', '.evento-item', '.agenda-item',
    '.post-item', '.card-evento', '.tribe-events-calendar-list__event',
    'article.post', '.wp-block-post', '.entry',
    '[class*="event"]', '[class*="evento"]', '[class*="agenda"]',
  ];

  let found = false;
  for (const sel of selectors) {
    const items = $(sel);
    if (items.length === 0) continue;

    found = true;
    items.each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, h4, .title, .event-title, .entry-title').first().text().trim();
      if (!title) return;

      const dateText = $el.find('.date, .event-date, .data, time, [class*="date"]').first().text().trim()
        || $el.find('time').attr('datetime') || '';
      const desc = $el.find('.description, .excerpt, .event-description, p').first().text().trim();
      const link = $el.find('a').first().attr('href') || '';
      const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
      const loc = $el.find('.location, .local, .venue, [class*="local"]').first().text().trim();
      const cat = $el.find('.category, .categoria, .tag, [class*="categ"]').first().text().trim();

      events.push({
        title,
        description: desc,
        date: dateText,
        location: loc,
        category: cat,
        imageUrl: img.startsWith('/') ? `${BASE_URL}${img}` : img,
        sourceUrl: link.startsWith('/') ? `${BASE_URL}${link}` : link,
        source: 'cm-barreiro-agenda',
        tags: [],
      });
    });

    if (events.length > 0) break;
  }

  // Fallback: procurar links para páginas de eventos individuais
  if (!found || events.length === 0) {
    console.log('  ⚠️ Seletores padrão não encontraram eventos, tentando links...');
    $('a[href*="evento"], a[href*="event"], a[href*="agenda"]').each((_, el) => {
      const $a = $(el);
      const title = $a.text().trim();
      const href = $a.attr('href') || '';
      if (title && title.length > 5 && title.length < 200) {
        events.push({
          title,
          sourceUrl: href.startsWith('/') ? `${BASE_URL}${href}` : href,
          source: 'cm-barreiro-agenda',
        });
      }
    });
  }

  return events;
}

// === Função principal exportada ===
export async function scrapeCMBarreiroAgenda(): Promise<RawEvent[]> {
  console.log('🏛️ Scraping CM Barreiro — Agenda de Eventos...');

  // Tenta API primeiro
  const apiEvents = await tryWPRestAPI();
  if (apiEvents && apiEvents.length > 0) {
    return apiEvents;
  }

  console.log('  ⚠️ API não disponível, usando scraping HTML...');
  return scrapeHTML();
}

// === Utilitários ===
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractTime(dateStr: string): string {
  const match = dateStr.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : '';
}