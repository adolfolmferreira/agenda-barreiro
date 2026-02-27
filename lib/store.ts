// lib/store.ts
// Armazenamento em ficheiro JSON — simples e funcional
// Em produção, pode ser migrado para Supabase, Vercel KV, etc.

import { promises as fs } from 'fs';
import path from 'path';
import type { Event } from './scraper';

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
}

export async function saveEvents(events: Event[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
}

export async function getEvents(): Promise<Event[]> {
  try {
    const data = await fs.readFile(EVENTS_FILE, 'utf-8');
    const events: Event[] = JSON.parse(data);
    // Filtrar passados (mais de 1 dia)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const cutoff = yesterday.toISOString().split('T')[0];
    return events
      .filter(e => (e.endDate || e.date) >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export async function getLastScrape(): Promise<string | null> {
  try {
    const events = await getEvents();
    return events[0]?.scrapedAt || null;
  } catch {
    return null;
  }
}