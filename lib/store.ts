// lib/store.ts
// Armazenamento simples de eventos
//
// Em desenvolvimento: guarda num ficheiro JSON local
// Em produção: pode ser migrado para Supabase, Vercel KV, ou outro
//
// A ideia é que o scraper escreve aqui e o frontend lê daqui,
// sem depender de base de dados externa na fase inicial.

import { promises as fs } from 'fs';
import path from 'path';
import type { NormalizedEvent } from './scrapers/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const META_FILE = path.join(DATA_DIR, 'meta.json');

interface StoreMeta {
  lastScrape: string;
  totalEvents: number;
  sources: Record<string, number>;
}

// Garantir que a pasta data/ existe
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // já existe
  }
}

// === Guardar eventos ===
export async function saveEvents(events: NormalizedEvent[]): Promise<void> {
  await ensureDataDir();

  // Ler eventos existentes e fazer merge
  const existing = await getEvents();
  const merged = mergeWithExisting(existing, events);

  await fs.writeFile(EVENTS_FILE, JSON.stringify(merged, null, 2), 'utf-8');

  // Guardar metadados
  const meta: StoreMeta = {
    lastScrape: new Date().toISOString(),
    totalEvents: merged.length,
    sources: {
      'cm-barreiro-agenda': merged.filter(e => e.source === 'cm-barreiro-agenda').length,
      'cm-barreiro-junior': merged.filter(e => e.source === 'cm-barreiro-junior').length,
      'outra': merged.filter(e => e.source === 'outra').length,
    },
  };
  await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
}

// === Ler eventos ===
export async function getEvents(): Promise<NormalizedEvent[]> {
  try {
    const data = await fs.readFile(EVENTS_FILE, 'utf-8');
    const events: NormalizedEvent[] = JSON.parse(data);

    // Filtrar eventos passados (mais de 1 dia atrás)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const cutoff = yesterday.toISOString().split('T')[0];

    return events.filter(e => {
      const endOrStart = e.endDate || e.date;
      return endOrStart >= cutoff;
    });
  } catch {
    // Ficheiro não existe ainda — devolver array vazio
    return [];
  }
}

// === Obter todos os eventos (incluindo passados) ===
export async function getAllEvents(): Promise<NormalizedEvent[]> {
  try {
    const data = await fs.readFile(EVENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// === Metadados ===
export async function getLastScrapeTime(): Promise<string | null> {
  try {
    const data = await fs.readFile(META_FILE, 'utf-8');
    const meta: StoreMeta = JSON.parse(data);
    return meta.lastScrape;
  } catch {
    return null;
  }
}

// === Merge inteligente ===
// Mantém eventos existentes que não foram re-scrapeados
// e actualiza os que foram
function mergeWithExisting(existing: NormalizedEvent[], fresh: NormalizedEvent[]): NormalizedEvent[] {
  const freshMap = new Map(fresh.map(e => [e.id, e]));
  const result = new Map<string, NormalizedEvent>();

  // Adicionar os existentes
  for (const e of existing) {
    result.set(e.id, e);
  }

  // Sobrescrever/adicionar os novos
  for (const e of fresh) {
    result.set(e.id, e);
  }

  // Ordenar por data
  return Array.from(result.values())
    .sort((a, b) => a.date.localeCompare(b.date));
}

// === Marcar como destaque ===
export async function setFeatured(eventId: string, featured: boolean): Promise<void> {
  const events = await getAllEvents();
  const idx = events.findIndex(e => e.id === eventId);
  if (idx >= 0) {
    events[idx].featured = featured;
    await ensureDataDir();
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  }
}