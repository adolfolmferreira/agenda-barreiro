// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/store';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cat = url.searchParams.get('category');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const q = url.searchParams.get('search');

  let events = await getEvents();

  if (cat) events = events.filter(e => e.category === cat);
  if (from) events = events.filter(e => e.date >= from);
  if (to) events = events.filter(e => e.date <= to);
  if (q) {
    const s = q.toLowerCase();
    events = events.filter(e =>
      e.title.toLowerCase().includes(s) ||
      e.description.toLowerCase().includes(s) ||
      e.location.toLowerCase().includes(s)
    );
  }

  return NextResponse.json({ events, total: events.length }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}