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
          if (fix.date !== undefined) ev.date = fix.date;
          if (fix.endDate !== undefined) ev.endDate = fix.endDate;
          if (fix.price !== undefined) ev.price = fix.price;
          if (fix.tags !== undefined) ev.tags = fix.tags;
          if (fix.descriptionFull !== undefined) ev.descriptionFull = fix.descriptionFull;
          if (fix.description !== undefined) ev.description = fix.description;
          if (fix.imageUrl !== undefined) ev.imageUrl = fix.imageUrl;
          console.log('  🔧 Override:', ev.title.slice(0, 50));
        }
      }
    } catch {}

    // Merge with existing events (keep old events not found in new scrape)
    try {
      const { loadEvents } = await import('../lib/store');
      const existing = await loadEvents();
      const newIds = new Set(events.map((e: any) => e.id));
      const kept = existing.filter((e: any) => !newIds.has(e.id));
      const merged = [...events, ...kept];
      merged.sort((a: any, b: any) => a.date.localeCompare(b.date));
      console.log(`  📦 Merge: ${events.length} novos + ${kept.length} mantidos = ${merged.length} total`);
      await saveEvents(merged);
    } catch {
      await saveEvents(events);
    }

    console.log(`\n💾 Guardados eventos em data/events.json`);
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