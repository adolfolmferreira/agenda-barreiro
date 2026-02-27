// app/api/events/route.ts
// Endpoint público para consultar os eventos
// GET /api/events → lista todos os eventos
// GET /api/events?category=música → filtrar por categoria
// GET /api/events?from=2026-03-01&to=2026-03-31 → filtrar por data
// GET /api/events?search=jazz → pesquisar

import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/store';
import type { NormalizedEvent } from '@/lib/scrapers/types';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const search = url.searchParams.get('search');
  const source = url.searchParams.get('source');
  const featured = url.searchParams.get('featured');
  const limit = parseInt(url.searchParams.get('limit') || '100');

  let events = await getEvents();

  // Filtrar por categoria
  if (category) {
    events = events.filter(e => e.category === category);
  }

  // Filtrar por fonte
  if (source) {
    events = events.filter(e => e.source === source);
  }

  // Filtrar por data
  if (from) {
    events = events.filter(e => e.date >= from);
  }
  if (to) {
    events = events.filter(e => e.date <= to);
  }

  // Filtrar destaques
  if (featured === 'true') {
    events = events.filter(e => e.featured);
  }

  // Pesquisar por texto
  if (search) {
    const q = search.toLowerCase();
    events = events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Ordenar por data (próximos primeiro)
  events.sort((a, b) => a.date.localeCompare(b.date));

  // Limitar
  const total = events.length;
  events = events.slice(0, limit);

  // Headers de cache (5 minutos)
  return NextResponse.json(
    {
      events,
      total,
      returned: events.length,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}