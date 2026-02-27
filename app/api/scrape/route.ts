// app/api/scrape/route.ts
// Endpoint para disparar o scraping manualmente ou via cron
// GET /api/scrape → executa scraping e devolve os eventos
// POST /api/scrape → mesma coisa (para cron jobs)
//
// Protecção: aceita um CRON_SECRET para evitar abusos
// Configura CRON_SECRET nas variáveis de ambiente

import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scrapers';
import { saveEvents, getLastScrapeTime } from '@/lib/store';

export const maxDuration = 60; // Vercel: máximo 60s para Hobby, 300s para Pro

async function handleScrape(request: Request) {
  // Verificar autorização (opcional mas recomendado)
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && secret !== cronSecret) {
    // Permitir chamadas sem secret em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const startTime = Date.now();
    console.log('🚀 Iniciando scraping de todas as fontes...');

    const events = await scrapeAllSources();

    // Guardar em cache/store
    await saveEvents(events);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Scraping concluído em ${duration}s — ${events.length} eventos`);

    return NextResponse.json({
      success: true,
      count: events.length,
      duration: `${duration}s`,
      events: events.slice(0, 5), // Preview dos primeiros 5
      sources: {
        'cm-barreiro-agenda': events.filter(e => e.source === 'cm-barreiro-agenda').length,
        'cm-barreiro-junior': events.filter(e => e.source === 'cm-barreiro-junior').length,
        'outra': events.filter(e => e.source === 'outra').length,
      },
    });
  } catch (error) {
    console.error('❌ Erro no scraping:', error);
    return NextResponse.json(
      { error: 'Scraping failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleScrape(request);
}

export async function POST(request: Request) {
  return handleScrape(request);
}