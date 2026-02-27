// app/api/events/route.ts
// GET /api/events              — todos os eventos
// GET /api/events?cat=Música   — filtrar por categoria
// GET /api/events?from=2026-03-01&to=2026-03-31

import { NextResponse } from 'next/server';
import { loadEvents, getLastUpdated } from '@/lib/store';

export const revalidate = 300; // ISR: revalidar a cada 5 min

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cat = url.searchParams.get('cat');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const q = url.searchParams.get('q');

  let events = await loadEvents();

  if (cat) events = events.filter(e => e.category === cat);
  if (from) events = events.filter(e => e.date >= from);
  if (to) events = events.filter(e => e.date <= to);
  if (q) {
    const s = q.toLowerCase();
    events = events.filter(e =>
      `${e.title} ${e.category} ${e.location} ${e.description}`.toLowerCase().includes(s)
    );
  }

  events.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    events,
    count: events.length,
    updatedAt: await getLastUpdated(),
  });
}