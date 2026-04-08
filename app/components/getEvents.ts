import { promises as fs } from 'fs';
import path from 'path';
import type { Event } from './types';

const PROXY_HOSTS = [
  'www.aml.pt',
  'aml.pt',
  'cdn.viralagenda.com',
  'viralagenda.com',
];

function proxyUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (PROXY_HOSTS.includes(parsed.hostname)) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {}
  return url;
}

export async function getEvents(): Promise<Event[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'events.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const events: Event[] = data.events || data || [];
    return events.map(e => ({
      ...e,
      imageUrl: proxyUrl(e.imageUrl),
    }));
  } catch {
    return [];
  }
}
