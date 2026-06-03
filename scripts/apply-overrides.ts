// scripts/apply-overrides.ts
// Applies all overrides.json corrections to events.json in place.
// Run with: npx ts-node scripts/apply-overrides.ts

import { promises as fs } from 'fs';
import { join } from 'path';

async function main() {
  const eventsPath = join(process.cwd(), 'data/events.json');
  const overridesPath = join(process.cwd(), 'data/overrides.json');

  const events = JSON.parse(await fs.readFile(eventsPath, 'utf-8'));
  const overrides = JSON.parse(await fs.readFile(overridesPath, 'utf-8'));

  let count = 0;

  for (const ev of events) {
    const fix = overrides[ev.title];
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
      if (fix.hidden !== undefined) ev.hidden = fix.hidden;
      console.log(`  🔧 ${ev.title.slice(0, 60)}`);
      count++;
    }
  }

  await fs.writeFile(eventsPath, JSON.stringify(events, null, 2));
  console.log(`\n✅ ${count} eventos atualizados em data/events.json`);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
