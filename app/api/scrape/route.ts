// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import { scrapeEvents } from '@/lib/scraper';
import { saveEvents } from '@/lib/store';

export const maxDuration = 60;

async function handleScrape(req: Request) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (process.env.CRON_SECRET && process.env.NODE_ENV === 'production' && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const t0 = Date.now();
    const events = await scrapeEvents();
    await saveEvents(events);
    const dur = ((Date.now() - t0) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      count: events.length,
      duration: `${dur}s`,
      preview: events.slice(0, 3).map(e => ({ title: e.title, date: e.date, location: e.location })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const GET = handleScrape;
export const POST = handleScrape;