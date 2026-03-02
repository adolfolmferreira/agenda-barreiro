import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch('https://cinecartaz.publico.pt/cinema/castello-lopes---forum-barreiro-215096', {
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();

    const paths = [...html.matchAll(/href="(\/filme\/[^"]+)"[^>]*class="button button--call-to-action/gi)];

    const films = await Promise.all(
      paths.slice(0, 5).map(async ([, path]) => {
        const url = 'https://cinecartaz.publico.pt' + path;
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
          const h = await r.text();
          const og = h.match(/og:image[^>]+content="([^"]+)"/i);
          const title = h.match(/og:title[^>]+content="([^"]+)"/i);
          return {
            title: title ? title[1] : path.split('/').pop() || '',
            url,
            img: og ? og[1].trim() : '',
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json(films.filter(Boolean), {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
