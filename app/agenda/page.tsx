import { getEvents } from '../components/getEvents';
import AgendaClient from './agenda-client';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Agenda de Eventos',
  description: 'Agenda completa de eventos no Barreiro. Filtre por categoria, mês e descubra concertos, teatro, exposições, workshops e muito mais.',
  alternates: { canonical: '/agenda' },
};

export default async function Page() {
  const events = await getEvents();
  return <AgendaClient events={events} />;
}
