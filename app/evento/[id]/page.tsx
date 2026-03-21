import { getEvents } from '../../components/getEvents';
import EventDetail from './event-detail';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const events = await getEvents();
  const event = events.find(e => e.id === id);

  if (!event) {
    return { title: 'Evento não encontrado' };
  }

  const title = event.title;
  const description = (event.description || event.descriptionFull || '').slice(0, 160);
  const url = `/evento/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: event.imageUrl ? [{ url: event.imageUrl, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: event.imageUrl ? [event.imageUrl] : [],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await getEvents();
  const event = events.find(e => e.id === id) || null;
  return <EventDetail event={event} />;
}
