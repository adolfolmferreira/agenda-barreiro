import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !url.startsWith('https://www.cm-barreiro.pt/')) {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return new NextResponse('PDF fetch failed', { status: 502 });
    const buffer = await res.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Error', { status: 500 });
  }
}
