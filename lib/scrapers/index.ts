// lib/scrapers/index.ts
// Motor principal de scraping — orquestra todas as fontes

import { scrapeCMBarreiroAgenda } from './cm-barreiro-agenda';
import { scrapeCMBarreiroJunior } from './cm-barreiro-junior';
import { scrapeOutra } from './outra';
import { normalizeEvents, deduplicateEvents } from './normalize';
import type { RawEvent, NormalizedEvent } from './types';

export async function scrapeAllSources(): Promise<NormalizedEvent[]> {
  const results: { source: string; events: RawEvent[]; error?: string }[] = [];

  // Scrape em paralelo — cada fonte é independente
  const [cmAgenda, cmJunior, outra] = await Promise.allSettled([
    scrapeCMBarreiroAgenda(),
    scrapeCMBarreiroJunior(),
    scrapeOutra(),
  ]);

  if (cmAgenda.status === 'fulfilled') {
    results.push({ source: 'cm-barreiro-agenda', events: cmAgenda.value });
    console.log(`✅ CM Barreiro Agenda: ${cmAgenda.value.length} eventos`);
  } else {
    results.push({ source: 'cm-barreiro-agenda', events: [], error: cmAgenda.reason?.message });
    console.error(`❌ CM Barreiro Agenda: ${cmAgenda.reason?.message}`);
  }

  if (cmJunior.status === 'fulfilled') {
    results.push({ source: 'cm-barreiro-junior', events: cmJunior.value });
    console.log(`✅ CM Barreiro Júnior: ${cmJunior.value.length} eventos`);
  } else {
    results.push({ source: 'cm-barreiro-junior', events: [], error: cmJunior.reason?.message });
    console.error(`❌ CM Barreiro Júnior: ${cmJunior.reason?.message}`);
  }

  if (outra.status === 'fulfilled') {
    results.push({ source: 'outra', events: outra.value });
    console.log(`✅ OUT.RA: ${outra.value.length} eventos`);
  } else {
    results.push({ source: 'outra', events: [], error: outra.reason?.message });
    console.error(`❌ OUT.RA: ${outra.reason?.message}`);
  }

  // Juntar todos os eventos raw
  const allRaw = results.flatMap(r => r.events);
  console.log(`📊 Total raw: ${allRaw.length} eventos`);

  // Normalizar
  const normalized = normalizeEvents(allRaw);

  // Deduplicar (mesmo título + mesma data = mesmo evento)
  const unique = deduplicateEvents(normalized);
  console.log(`📊 Após deduplicação: ${unique.length} eventos`);

  return unique;
}