import { promises as fs } from 'fs';
import path from 'path';
import type { Event } from './types';

export async function getEvents(): Promise<Event[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'events.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return data.events || data || [];
  } catch {
    return [];
  }
}
