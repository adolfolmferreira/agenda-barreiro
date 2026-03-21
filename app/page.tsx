import { getEvents } from './components/getEvents';
import HomeClient from './home-client';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Agenda B — Eventos e Cultura no Barreiro',
  description: 'Descubra o que se passa no Barreiro. Concertos, teatro, exposições, workshops, cinema e eventos para toda a família.',
  alternates: { canonical: '/' },
};

export default async function Page() {
  const events = await getEvents();
  return <HomeClient events={events} />;
}
