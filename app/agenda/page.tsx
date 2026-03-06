import { getEvents } from '../components/getEvents';
import AgendaClient from './agenda-client';

export const revalidate = 3600;

export default async function Page() {
  const events = await getEvents();
  return <AgendaClient events={events} />;
}
