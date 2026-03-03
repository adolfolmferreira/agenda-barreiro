// scripts/scrape.ts
import { scrapeEvents } from '../lib/scraper';
import { saveEvents } from '../lib/store';

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Agenda Barreiro — Scraper v5');
  console.log('  Fonte: cm-barreiro.pt/agenda-de-eventos');
  console.log('═══════════════════════════════════════\n');

  const t0 = Date.now();
  const events = await scrapeEvents();
  const dur = ((Date.now() - t0) / 1000).toFixed(1);

  if (events.length > 0) {
    // Apply manual overrides
    try {
      const { promises: fs } = await import('fs');
      const { join } = await import('path');
      const raw = await fs.readFile(join(process.cwd(), 'data/overrides.json'), 'utf-8');
      const ovr = JSON.parse(raw);
      for (const ev of events) {
        const fix = ovr[ev.title];
        if (fix) {
          if (fix.location !== undefined) ev.location = fix.location;
          if (fix.category !== undefined) ev.category = fix.category;
          console.log('  🔧 Override:', ev.title.slice(0, 50));
        }
      }
    } catch {}

    await saveEvents(events);
    console.log(`\n💾 Guardados ${events.length} eventos em data/events.json`);
  } else {
    console.log('\n⚠️ Nenhum evento encontrado — data/events.json não alterado');
  }

  console.log(`\n══════════════════════════════════════`);
  console.log(`  ${events.length} eventos · ${dur}s`);
  console.log(`══════════════════════════════════════\n`);

  for (const e of events) {
    console.log(`  📅 ${e.date}${e.endDate ? ' → ' + e.endDate : ''} · ${e.category}`);
    console.log(`     ${e.title}`);
    console.log(`     📍 ${e.location}`);
    if (e.imageUrl) console.log(`     🖼️  ${e.imageUrl.slice(0, 80)}`);
    if (e.price) console.log(`     💰 ${e.price}`);
    console.log('');
  }
}

main().catch(console.error);