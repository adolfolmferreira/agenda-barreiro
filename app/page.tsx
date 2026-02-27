// app/page.tsx
import { getEvents } from '@/lib/store';
import type { Event } from '@/lib/scraper';
import ClientPage from './client-page';

export const revalidate = 300;

export default async function Home() {
  let events: Event[] = [];
  try {
    events = await getEvents();
  } catch {}
  return <ClientPage initialEvents={events} />;
}