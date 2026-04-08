import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = [
  'www.aml.pt',
  'aml.pt',
  'cdn.viralagenda.com',
  'viralagenda.com',
  'www.cm-barreiro.pt',
  'cm-barreiro.pt',
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return new NextResponse('Missing path', { status: 400 });
  }

  // Reconstruct URL: /api/img/https/www.aml.pt/wp-content/uploads/...
  const url = path.join('/').replace(/^(https?):\//, '$1://');

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AgendaB/1.0)',
        'Referer': parsed.origin,
      },
    });

    if (!res.ok) {
      return new NextResponse('Upstream error', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch {
    return new NextResponse('Fetch failed', { status: 502 });
  }
}
