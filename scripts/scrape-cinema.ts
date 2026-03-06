import { writeFileSync, mkdirSync } from 'fs';

const SKIP_PATTERNS = [
  'castello-lopes', 'button_', 'app-store', 'google-play',
  'LRE_Theme', 'cinzento', 'white_1', 'logo'
];

function isPoster(src: string): boolean {
  const lower = src.toLowerCase();
  return !SKIP_PATTERNS.some(p => lower.includes(p.toLowerCase()));
}

async function scrapeCinema() {
  console.log('🎬 Scraping cinema from castellolopescinemas.pt (Barra Shopping Barreiro)...\n');

  const res = await fetch('https://castellolopescinemas.pt/barra-shopping-barreiro/', {
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();

  const films: { title: string; url: string; img: string }[] = [];
  const seen = new Set<string>();
  const re = /<option value="(https:\/\/castellolopescinemas\.pt\/filmes\/[^"]+)">([^<]+)<\/option>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const url = m[1];
    const title = m[2].replace(/&#171;|&#187;/g, '').trim();
    if (!seen.has(url)) {
      seen.add(url);
      films.push({ title, url, img: '' });
    }
  }

  console.log(`📋 ${films.length} filmes encontrados\n`);

  for (const film of films) {
    try {
      const r = await fetch(film.url, { signal: AbortSignal.timeout(10000) });
      const h = await r.text();

      // Find first content image that's not a logo/button
      const imgRe = /src="(https:\/\/castellolopescinemas\.pt\/wp-content\/uploads\/[^"]+)"/gi;
      let im: RegExpExecArray | null;
      while ((im = imgRe.exec(h)) !== null) {
        if (isPoster(im[1])) {
          film.img = im[1];
          break;
        }
      }

      console.log(`  ✅ ${film.title}${film.img ? '' : ' (sem poster)'}`);
    } catch {
      console.log(`  ❌ ${film.title} - erro`);
    }
  }

  mkdirSync('data', { recursive: true });
  writeFileSync('data/cinema.json', JSON.stringify(films, null, 2));
  console.log(`\n💾 ${films.length} filmes guardados em data/cinema.json`);
}

scrapeCinema().catch(console.error);
