// lib/store.ts
// Lê e escreve eventos no ficheiro JSON
// Não depende do Playwright — pode ser importado pelo Next.js sem problemas

import { promises as fs } from 'fs';
import path from 'path';

export interface Event {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  date: string;
  endDate?: string;
  time?: string;
  location: string;
  price: string;
  description: string;
  descriptionFull?: string;
  url: string;
  imageUrl?: string;
  organizer?: string;
  contacts?: string;
  ticketUrl?: string;
  ageRating?: string;
  tags?: string[];
  source: string;
  scrapedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'events.json');

export async function loadEvents(): Promise<Event[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return data.events || [];
  } catch {
    return [];
  }
}

export async function saveEvents(events: Event[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify({ events, updatedAt: new Date().toISOString() }, null, 2)
  );
}

export async function getLastUpdated(): Promise<string | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw).updatedAt || null;
  } catch {
    return null;
  }
}