import { getEvents } from '../../components/getEvents';
import EventDetail from './event-detail';

export const revalidate = 3600;

export default async function Page({ params }: { params: { id: string } }) {
  const events = await getEvents();
  const event = events.find(e => e.id === params.id) || null;
  return <EventDetail event={event} />;
}
