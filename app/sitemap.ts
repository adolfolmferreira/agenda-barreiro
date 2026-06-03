import { getEvents } from './components/getEvents';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getEvents();
  const baseUrl = 'https://agendab.pt';

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/agenda`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/contactos`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
  ];

  const eventPages = events.map(e => ({
    url: `${baseUrl}/evento/${e.id}`,
    lastModified: e.scrapedAt ? new Date(e.scrapedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...eventPages];
}
