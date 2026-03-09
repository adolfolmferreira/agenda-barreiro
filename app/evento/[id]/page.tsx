import { getEvents } from '../../components/getEvents';
import EventDetail from './event-detail';

export const revalidate = 3600;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await getEvents();
  const event = events.find(e => e.id === id) || null;
  return <EventDetail event={event} />;
}
