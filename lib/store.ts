// lib/store.ts
import { promises as fs } from 'fs';
import path from 'path';
import type { Event } from './scraper';

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

export async function saveEvents(events: Event[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
}

export async function loadEvents(): Promise<Event[]> {
  try {
    const raw = await fs.readFile(EVENTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getLastUpdated(): Promise<string | null> {
  try {
    const stat = await fs.stat(EVENTS_FILE);
    return stat.mtime.toISOString();
  } catch {
    return null;
  }
}