import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function slug(t: string): string {
  return t.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 60);
}

import he from 'he';

function decodeHtml(s: string): string {
  return he.decode(s);
}

const MO: Record<string, string> = {
  'janeiro':'01','fevereiro':'02','março':'03','marco':'03','abril':'04',
  'maio':'05','junho':'06','julho':'07','agosto':'08',
  'setembro':'09','outubro':'10','novembro':'11','dezembro':'12',
};

function parseDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+([a-záàâãéêíóôõúç]+)\s+(\d{4})/i);
  if (!m) return null;
  const mo = MO[m[2].toLowerCase()];
  if (!mo) return null;
  return `${m[3]}-${mo}-${m[1].padStart(2, '0')}`;
}

function mapCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('concerto') || c.includes('música') || c.includes('musica')) return 'Música';
  if (c.includes('teatro')) return 'Teatro';
  if (c.includes('dança') || c.includes('danca')) return 'Dança';
  if (c.includes('exposiç') || c.includes('exposic')) return 'Exposição';
  if (c.includes('cinema')) return 'Cinema';
  if (c.includes('workshop') || c.includes('formação') || c.includes('oficina')) return 'Workshop';
  if (c.includes('feira') || c.includes('mercado')) return 'Feira';
  if (c.includes('festival')) return 'Festival';
  if (c.includes('literatur') || c.includes('livro')) return 'Literatura';
  return 'Outro';
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Agenda Barreiro — AML Scraper');
  console.log('  Fonte: aml.pt/agenda');
  console.log('═══════════════════════════════════════\n');

  const t0 = Date.now();

  // Load existing events
  const eventsPath = join(process.cwd(), 'data', 'events.json');
  let existing: any[] = [];
  try {
    existing = JSON.parse(readFileSync(eventsPath, 'utf-8'));
  } catch {}

  const existingSlugs = new Set(existing.map((e: any) => slug(e.title)));
  console.log(`📦 ${existing.length} eventos existentes\n`);

  // Get event URLs from listing
  const res = await fetch('https://www.aml.pt/agenda/?ano=2026&municipios[]=barreiro', {
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();

  const urls = new Set<string>();
  const re = /href="(https:\/\/www\.aml\.pt\/agenda\/[a-z0-9-]+\/)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const u = m[1];
    if (!u.includes('?') && !u.includes('feed')) urls.add(u);
  }

  console.log(`📋 ${urls.size} URLs de eventos encontrados\n`);

  // Scrape each event
  const newEvents: any[] = [];
  for (const url of Array.from(urls)) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const h = await r.text();

      // Title
      const ogTitle = h.match(/og:title[^>]*content="([^"]*)"/i);
      const title = ogTitle
        ? decodeHtml(ogTitle[1]).replace(/•.*$/, '').replace(/\s*\|.*$/, '').trim()
        : '';
      if (!title) continue;

      // Check duplicate by slug and by first words + date
      const titleSlug = slug(title);
      const titleWords = title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).slice(0, 3).join(' ');
      const isDuplicate = existingSlugs.has(titleSlug) ||
          Array.from(existingSlugs).some(s => s.includes(titleSlug) || titleSlug.includes(s)) ||
          existing.some(e => {
            const eWords = e.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).slice(0, 3).join(' ');
            return eWords === titleWords && e.date === date;
          });
      if (isDuplicate) {
        console.log(`  ⏭ Duplicado: ${title.slice(0, 50)}`);
        continue;
      }

      // Image
      const ogImg = h.match(/og:image[^>]*content="([^"]*)"/i);
      const image = ogImg ? ogImg[1] : '';

      // Description
      const ogDesc = h.match(/og:description[^>]*content="([^"]*)"/i);
      const description = ogDesc ? decodeHtml(ogDesc[1]).trim() : '';

      // Date
      const dateMatch = h.match(/class="post-date">([^<]+)/i);
      const date = dateMatch ? parseDate(dateMatch[1]) : null;
      if (!date) {
        console.log(`  ⚠ Sem data: ${title.slice(0, 50)}`);
        continue;
      }

      // Price
      const priceMatch = h.match(/<strong>Preço<\/strong><br>\s*<small><p>([^<]+)/i);
      const price = priceMatch ? decodeHtml(priceMatch[1]).trim() : '';

      // Location & Hours
      const locMatch = h.match(/<strong>Local & Horário<\/strong><br>\s*<small><p>([^<]+)/i);
      let location = 'Barreiro';
      if (locMatch) {
        const parts = locMatch[1].split('|');
        location = decodeHtml(parts[0]).replace(/,\s*Barreiro\s*$/, '').trim() || 'Barreiro';
      }

      // Category
      const catMatch = h.match(/post-cat[^>]*>([^<]+)/i);
      const category = catMatch ? mapCategory(catMatch[1]) : 'Outro';

      const event = {
        id: (url.split('/agenda/')[1] || titleSlug).replace(/\/$/, '').slice(0, 80) || `${titleSlug}-${date}`,
        title,
        date,
        endDate: '',
        time: '',
        location,
        category,
        description: description.slice(0, 300),
        descriptionFull: description,
        imageUrl: image,
        price: price || '',
        source: 'aml',
        sourceUrl: url,
        featured: false,
      };

      newEvents.push(event);
      existingSlugs.add(titleSlug);
      console.log(`  ✅ Novo: ${title.slice(0, 50)} (${date})`);
    } catch (e) {
      console.log(`  ❌ Erro: ${url}`);
    }
  }

  // Merge and apply overrides
  const merged = [...existing, ...newEvents];

  try {
    const ovrRaw = readFileSync(join(process.cwd(), 'data', 'overrides.json'), 'utf-8');
    const ovr = JSON.parse(ovrRaw);
    for (const ev of merged) {
      const fix = ovr[ev.title];
      if (fix) {
        if (fix.location !== undefined) ev.location = fix.location;
        if (fix.category !== undefined) ev.category = fix.category;
        if (fix.date !== undefined) ev.date = fix.date;
        if (fix.endDate !== undefined) ev.endDate = fix.endDate;
        if (fix.price !== undefined) ev.price = fix.price;
        if (fix.tags !== undefined) ev.tags = fix.tags;
          if (fix.descriptionFull !== undefined) ev.descriptionFull = fix.descriptionFull;
          if (fix.description !== undefined) ev.description = fix.description;
          if (fix.imageUrl !== undefined) ev.imageUrl = fix.imageUrl;
          if (fix.hidden !== undefined) (ev as any).hidden = fix.hidden;
      }
    }
  } catch {}

  merged.sort((a, b) => a.date.localeCompare(b.date));
  writeFileSync(eventsPath, JSON.stringify(merged, null, 2));

  const dur = ((Date.now() - t0) / 1000).toFixed(1);

  if (newEvents.length > 0) {
    console.log(`\n💾 ${newEvents.length} novos eventos adicionados (total: ${merged.length})`);
  } else {
    console.log(`\n📭 Nenhum evento novo (overrides aplicados, total: ${merged.length})`);
  }

  console.log(`\n══════════════════════════════════════`);
  console.log(`  ${newEvents.length} novos · ${dur}s`);
  console.log(`══════════════════════════════════════\n`);
}

main().catch(console.error);
