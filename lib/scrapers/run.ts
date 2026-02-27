// lib/scrapers/run.ts
// Script standalone para testar o scraping localmente
// Uso: npx tsx lib/scrapers/run.ts

import { scrapeAllSources } from './index';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Agenda Barreiro — Scraper Manual');
  console.log('═══════════════════════════════════════\n');

  const start = Date.now();
  const events = await scrapeAllSources();
  const duration = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Resultados:`);
  console.log(`  Total: ${events.length} eventos`);
  console.log(`  CM Barreiro: ${events.filter(e => e.source === 'cm-barreiro-agenda').length}`);
  console.log(`  CM Barreiro Júnior: ${events.filter(e => e.source === 'cm-barreiro-junior').length}`);
  console.log(`  OUT.RA: ${events.filter(e => e.source === 'outra').length}`);
  console.log(`  Duração: ${duration}s`);
  console.log(`═══════════════════════════════════════\n`);

  // Guardar resultado em data/events.json
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    path.join(dataDir, 'events.json'),
    JSON.stringify(events, null, 2),
    'utf-8'
  );
  console.log(`💾 Guardado em data/events.json`);

  // Mostrar preview
  console.log(`\n📋 Preview (primeiros 5 eventos):\n`);
  for (const e of events.slice(0, 5)) {
    console.log(`  📅 ${e.date} | ${e.category} | ${e.title}`);
    console.log(`     📍 ${e.location} | 🔗 ${e.sourceUrl || 'sem link'}`);
    console.log('');
  }
}

main().catch(console.error);