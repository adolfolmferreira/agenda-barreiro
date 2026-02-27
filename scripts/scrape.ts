// scripts/scrape.ts
// Uso: npx tsx scripts/scrape.ts
import { scrapeEvents } from '../lib/scraper';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Agenda Barreiro — Scraper');
  console.log('  Fonte: cm-barreiro.pt');
  console.log('═══════════════════════════════════════\n');

  const t0 = Date.now();
  const events = await scrapeEvents();
  const dur = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n══════════════════════════════════════`);
  console.log(`  ${events.length} eventos · ${dur}s`);
  console.log(`══════════════════════════════════════\n`);

  // Guardar
  const dir = path.join(process.cwd(), 'data');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'events.json'), JSON.stringify(events, null, 2));
  console.log('💾 Guardado em data/events.json\n');

  // Preview
  for (const e of events.slice(0, 10)) {
    console.log(`  📅 ${e.date} · ${e.category}`);
    console.log(`     ${e.title}`);
    console.log(`     📍 ${e.location}`);
    console.log(`     🔗 ${e.sourceUrl}`);
    console.log('');
  }
}

main().catch(console.error);