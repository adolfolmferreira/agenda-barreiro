import { writeFileSync, mkdirSync } from 'fs';

async function scrapeCinema() {
  console.log('🎬 Scraping cinema from cinecartaz.publico.pt...');
  
  const res = await fetch('https://cinecartaz.publico.pt/cinema/castello-lopes---forum-barreiro-215096', {
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();

  const paths: string[] = [];
  const re = /href="\/filme\/([^"]+)"[^>]*class="button button--call-to-action/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) paths.push(match[1]);
  console.log(`Found ${paths.length} films`);

  const films = [];
  for (const path of paths.slice(0, 5)) {
    const url = 'https://cinecartaz.publico.pt' + path;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const h = await r.text();
      const og = h.match(/og:image[^>]+content="([^"]+)"/i);
      const title = h.match(/og:title[^>]+content="([^"]+)"/i);
      const film = {
        title: title ? title[1] : path.split('/').pop() || '',
        url,
        img: og ? og[1].trim() : '',
      };
      films.push(film);
      console.log(`  ✓ ${film.title}`);
    } catch (e) {
      console.log(`  ✗ ${path} - error`);
    }
  }

  mkdirSync('data', { recursive: true });
  writeFileSync('data/cinema.json', JSON.stringify(films, null, 2));
  console.log(`\n✅ Saved ${films.length} films to data/cinema.json`);
}

scrapeCinema().catch(console.error);
