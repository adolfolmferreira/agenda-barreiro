// app/page.tsx
// Frontend da Agenda Barreiro — consome /api/events
// Design editorial inspirado no Teatro São Luiz

import { getEvents } from '@/lib/store';
import type { NormalizedEvent } from '@/lib/scrapers/types';
import ClientPage from './client-page';

// Server component: busca dados no servidor
export const revalidate = 300; // Revalidar a cada 5 minutos

export default async function Home() {
  let events: NormalizedEvent[] = [];

  try {
    events = await getEvents();
  } catch (e) {
    console.error('Erro ao carregar eventos:', e);
  }

  return <ClientPage initialEvents={events} />;
}