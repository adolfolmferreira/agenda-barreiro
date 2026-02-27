import { promises as fs } from 'fs';
import path from 'path';
import ClientPage from './client-page';

// Revalidate every 6 hours — Next.js ISR
// When deployed on Vercel, the page rebuilds automatically after this interval
export const revalidate = 21600; // 6h in seconds

async function getEvents() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'events.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return {
      events: data.events || data || [],
      lastUpdated: data.lastUpdated || data.scrapedAt || null,
    };
  } catch (e) {
    console.error('Failed to load events.json:', e);
    return { events: [], lastUpdated: null };
  }
}

export default async function Page() {
  const { events, lastUpdated } = await getEvents();
  return <ClientPage events={events} lastUpdated={lastUpdated} />;
}