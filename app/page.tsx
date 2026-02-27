// app/page.tsx
import { loadEvents, getLastUpdated } from '@/lib/store';
import type { Event } from '@/lib/scraper';
import ClientPage from './client-page';

export const revalidate = 300;

export default async function Home() {
  let events: Event[] = [];
  let updatedAt: string | null = null;
  try {
    events = await loadEvents();
    updatedAt = await getLastUpdated();
  } catch {}
  return <ClientPage events={events} updatedAt={updatedAt} />;
}