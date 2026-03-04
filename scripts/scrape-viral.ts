import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ViralEvent {
  id: string;
  title: string;
  date: string;
  endDate: string;
  time: string;
  location: string;
  category: string;
  description: string;
  descriptionFull: string;
  imageUrl: string;
  price: string;
  source: string;
  sourceUrl: string;
  featured: boolean;
}

function slug(t: string): string {
  return t.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getEventUrls(): Promise<{ url: string; dateStart: string; dateEnd: string }[]> {
  console.log('🔍 A buscar listagem da Viral Agenda...\n');
  const res = await fetch('https://www.viralagenda.com/pt/setubal/barreiro', {
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();

  const events: { url: string; dateStart: string; dateEnd: string }[] = [];
  const re = /data-url="(\/pt\/events\/[^"]+)"[^>]*data-href="[^"]*"\s*data-date-start="([^"]*)"(?:\s*data-date-end="([^"]*)"|)/g;
  let m: RegExpExecArray | null;

  // Try alternative: parse li elements
  const liRe = /<li[^>]*data-url="(\/pt\/events\/[^"]+)"[^>]*data-date-start="([^"]*)"(?:[^>]*data-date-end="([^"]*)")?/g;
  while ((m = liRe.exec(html)) !== null) {
    events.push({
      url: 'https://www.viralagenda.com' + m[1],
      dateStart: m[2],
      dateEnd: m[3] || '',
    });
  }

  console.log(`📋 ${events.length} eventos encontrados na listagem\n`);
  return events;
}

async function scrapeEventDetail(url: string): Promise<{
  title: string; location: string; image: string; description: string; category: string;
} | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const html = await res.text();

    const ogTitle = html.match(/og:title[^>]*content="([^"]*)"/) ;
    const title = ogTitle
      ? ogTitle[1].replace(/ - Viral Agenda$/, '').replace(/ - Barreiro$/, '').trim()
      : '';

    const locMatch = html.match(/location:\s*"([^"]*)"/);
    const location = locMatch ? locMatch[1].trim() : 'Barreiro';

    const ogImage = html.match(/og:image[^>]*content="([^"]*)"/);
    const image = ogImage ? ogImage[1] : '';

    const ogDesc = html.match(/og:description[^>]*content="([^"]*)"/);
    const description = ogDesc ? ogDesc[1].replace(/&raquo;/g, '»').replace(/&amp;/g, '&').trim() : '';

    // Category from og:description (format: "Title » Venue » Category - date")
    const catMatch = description.match(/»\s*([^»-]+)\s*-\s*\d/);
    const category = catMatch ? catMatch[1].trim() : '';

    if (!title) return null;
    return { title, location, image, description, category };
  } catch (e) {
    console.error(`  ❌ Erro: ${url}`, e);
    return null;
  }
}

function mapCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('concerto') || c.includes('música') || c.includes('musica')) return 'Música';
  if (c.includes('teatro')) return 'Teatro';
  if (c.includes('dança') || c.includes('danca')) return 'Dança';
  if (c.includes('exposição') || c.includes('exposicao')) return 'Exposição';
  if (c.includes('cinema')) return 'Cinema';
  if (c.includes('workshop') || c.includes('formação') || c.includes('formacao')) return 'Workshop';
  if (c.includes('feira') || c.includes('mercado')) return 'Feira';
  if (c.includes('festival')) return 'Festival';
  if (c.includes('literatura') || c.includes('livro')) return 'Literatura';
  return 'Outro';
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Agenda Barreiro — Viral Agenda Scraper');
  console.log('  Fonte: viralagenda.com/pt/setubal/barreiro');
  console.log('═══════════════════════════════════════\n');

  const t0 = Date.now();

  // Load existing events
  const eventsPath = join(process.cwd(), 'data', 'events.json');
  let existing: any[] = [];
  try {
    existing = JSON.parse(readFileSync(eventsPath, 'utf-8'));
  } catch {}

  const existingSlugs = new Set(existing.map((e: any) => slug(e.title)));
  console.log(`📦 ${existing.length} eventos existentes (${existingSlugs.size} títulos únicos)\n`);

  // Get event URLs from listing
  const listings = await getEventUrls();

  // Filter future events only
  const today = new Date().toISOString().slice(0, 10);
  const future = listings.filter(l => {
    const d = l.dateStart.slice(0, 10);
    return d >= today;
  });
  console.log(`📅 ${future.length} eventos futuros\n`);

  // Scrape each event detail
  const newEvents: any[] = [];
  for (const item of future) {
    const detail = await scrapeEventDetail(item.url);
    if (!detail) continue;

    // Check for duplicates by comparing title slugs
    const titleSlug = slug(detail.title);
    const isDuplicate = existingSlugs.has(titleSlug) ||
      // Also check partial matches
      [...existingSlugs].some(s => s.includes(titleSlug) || titleSlug.includes(s));

    if (isDuplicate) {
      console.log(`  ⏭ Duplicado: ${detail.title.slice(0, 50)}`);
      continue;
    }

    const date = item.dateStart.slice(0, 10);
    const endDate = item.dateEnd ? item.dateEnd.slice(0, 10) : '';
    const timeMatch = item.dateStart.match(/T(\d{2}:\d{2})/);
    const time = timeMatch ? timeMatch[1] : '';

    const event = {
      id: `${slug(detail.title)}-${date}`,
      title: detail.title,
      date,
      endDate: endDate !== date ? endDate : '',
      time,
      location: detail.location || 'Barreiro',
      category: mapCategory(detail.category),
      description: detail.description.slice(0, 300),
      descriptionFull: detail.description,
      imageUrl: detail.image,
      price: '',
      source: 'viral',
      sourceUrl: item.url,
      featured: false,
    };

    newEvents.push(event);
    existingSlugs.add(titleSlug);
    console.log(`  ✅ Novo: ${detail.title.slice(0, 50)} (${date})`);
  }

  const dur = ((Date.now() - t0) / 1000).toFixed(1);

  if (newEvents.length > 0) {
    const merged = [...existing, ...newEvents];
    merged.sort((a, b) => a.date.localeCompare(b.date));
    writeFileSync(eventsPath, JSON.stringify(merged, null, 2));
    console.log(`\n💾 ${newEvents.length} novos eventos adicionados (total: ${merged.length})`);
  } else {
    console.log('\n📭 Nenhum evento novo encontrado');
  }

  console.log(`\n══════════════════════════════════════`);
  console.log(`  ${newEvents.length} novos · ${dur}s`);
  console.log(`══════════════════════════════════════\n`);
}

main().catch(console.error);
