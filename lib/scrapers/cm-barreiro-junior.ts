// lib/scrapers/cm-barreiro-junior.ts
// Scraper para https://www.cm-barreiro.pt/participar/publicacoes-municipais/agendas/agenda-2830-junior/
//
// A Agenda 2830 Júnior é uma publicação mensal da CM Barreiro
// dirigida ao público jovem. Tipicamente é publicada como PDF
// ou como página com listagem de eventos para crianças/jovens.

import * as cheerio from 'cheerio';
import type { RawEvent } from './types';

const BASE_URL = 'https://www.cm-barreiro.pt';
const JUNIOR_URL = `${BASE_URL}/participar/publicacoes-municipais/agendas/agenda-2830-junior/`;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
};

export async function scrapeCMBarreiroJunior(): Promise<RawEvent[]> {
  console.log('👶 Scraping CM Barreiro — Agenda 2830 Júnior...');

  const res = await fetch(JUNIOR_URL, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ao aceder ${JUNIOR_URL}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const events: RawEvent[] = [];

  // A agenda júnior pode ter:
  // 1. Links para PDFs das agendas mensais
  // 2. Cards de eventos directamente na página
  // 3. Uma listagem simples com títulos e datas

  // Procurar cards de eventos (mesma lógica que a agenda principal)
  const eventSelectors = [
    '.event-item', '.evento-item', '.agenda-item',
    'article.post', '.post-item', '.card',
    '[class*="event"]', '[class*="evento"]',
  ];

  for (const sel of eventSelectors) {
    const items = $(sel);
    if (items.length === 0) continue;

    items.each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, h4, .title, .entry-title').first().text().trim();
      if (!title) return;

      const dateText = $el.find('.date, time, [class*="date"], [class*="data"]').first().text().trim()
        || $el.find('time').attr('datetime') || '';
      const desc = $el.find('.description, .excerpt, p').first().text().trim();
      const link = $el.find('a').first().attr('href') || '';
      const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
      const loc = $el.find('.location, .local, [class*="local"]').first().text().trim();

      events.push({
        title,
        description: desc,
        date: dateText,
        location: loc,
        category: 'infantil', // Agenda Júnior → sempre categoria infantil
        imageUrl: img.startsWith('/') ? `${BASE_URL}${img}` : img,
        sourceUrl: link.startsWith('/') ? `${BASE_URL}${link}` : link,
        source: 'cm-barreiro-junior',
        tags: ['júnior', 'crianças', 'famílias'],
      });
    });

    if (events.length > 0) break;
  }

  // Procurar PDFs da agenda mensal (para referência / link)
  const pdfLinks: string[] = [];
  $('a[href$=".pdf"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (href && (text.toLowerCase().includes('agenda') || href.toLowerCase().includes('agenda'))) {
      pdfLinks.push(href.startsWith('/') ? `${BASE_URL}${href}` : href);
    }
  });

  if (pdfLinks.length > 0) {
    console.log(`  📎 PDFs da Agenda Júnior encontrados: ${pdfLinks.length}`);
    // Adicionar como evento "especial" para que apareça no site
    if (events.length === 0) {
      const latestPdf = pdfLinks[0];
      const monthMatch = latestPdf.match(/(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i);
      events.push({
        title: `Agenda 2830 Júnior — ${monthMatch?.[1] || 'Este mês'}`,
        description: 'Agenda mensal de actividades para crianças e jovens no Barreiro. Consulta o PDF para ver todos os eventos.',
        date: new Date().toISOString().split('T')[0],
        location: 'Vários locais no Barreiro',
        category: 'infantil',
        sourceUrl: latestPdf,
        source: 'cm-barreiro-junior',
        tags: ['júnior', 'crianças', 'famílias', 'pdf'],
      });
    }
  }

  // Fallback: procurar links genéricos para sub-páginas de eventos
  if (events.length === 0) {
    console.log('  ⚠️ Procurando links para sub-páginas...');
    const mainContent = $('.entry-content, .page-content, .content, main, #content');
    mainContent.find('a').each((_, el) => {
      const $a = $(el);
      const title = $a.text().trim();
      const href = $a.attr('href') || '';
      if (title && title.length > 5 && title.length < 200 && !href.endsWith('.pdf')) {
        events.push({
          title,
          sourceUrl: href.startsWith('/') ? `${BASE_URL}${href}` : href,
          source: 'cm-barreiro-junior',
          category: 'infantil',
          tags: ['júnior', 'crianças'],
        });
      }
    });
  }

  return events;
}