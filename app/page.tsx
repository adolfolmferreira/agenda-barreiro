// app/page.tsx
// Server component — carrega eventos e passa ao client

import { loadEvents, getLastUpdated } from '@/lib/store';
import ClientPage from './client-page';

export const revalidate = 300; // ISR: revalidar a cada 5 min

export default async function Home() {
  const events = await loadEvents();
  const updatedAt = await getLastUpdated();

  return <ClientPage events={events} updatedAt={updatedAt} />;
}