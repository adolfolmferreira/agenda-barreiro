// app/api/scrape/route.ts
// Endpoint para scraping automático (chamado pelo Vercel Cron)
// GET /api/scrape  — executa scraping
// Protegido por CRON_SECRET em produção

import { NextResponse } from 'next/server';
import { scrapeEvents } from '@/lib/scraper';
import { saveEvents } from '@/lib/store';

export const maxDuration = 60; // Vercel Pro: até 300s

export async function GET(req: Request) {
  // Verify cron secret in production
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    // Allow without secret in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    console.log('🔄 Starting scrape...');
    const events = await scrapeEvents();

    if (events.length > 0) {
      await saveEvents(events);
      return NextResponse.json({
        ok: true,
        count: events.length,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      count: 0,
      message: 'No events found — keeping existing data',
    });
  } catch (err: any) {
    console.error('Scrape error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}