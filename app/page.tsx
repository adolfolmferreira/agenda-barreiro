import { getEvents } from './components/getEvents';
import HomeClient from './home-client';

export const revalidate = 3600;

export default async function Page() {
  const events = await getEvents();
  return <HomeClient events={events} />;
}
