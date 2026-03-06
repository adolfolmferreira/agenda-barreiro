import { writeFileSync, mkdirSync } from 'fs';

async function scrapeCinema() {
  console.log('🎬 Scraping cinema from castellolopescinemas.pt (Barra Shopping Barreiro)...\n');

  const res = await fetch('https://castellolopescinemas.pt/barra-shopping-barreiro/', {
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();

  // Extract film URLs and titles from the dropdown or list
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

  // Fetch poster for each film
  for (const film of films) {
    try {
      const r = await fetch(film.url, { signal: AbortSignal.timeout(10000) });
      const h = await r.text();
      const og = h.match(/og:image[^>]+content="([^"]+)"/i);
      if (og) film.img = og[1].trim();

      // Try to get a better poster image (portrait)
      const poster = h.match(/wp-content\/uploads\/[^"]*poster[^"]*/i) ||
                     h.match(/wp-content\/uploads\/[^"]*\.jpg/i);
      if (poster) {
        const fullUrl = poster[0].startsWith('http') ? poster[0] : 'https://castellolopescinemas.pt/' + poster[0];
        // Only use if different from og:image (might be portrait)
        if (fullUrl !== film.img) film.img = film.img || fullUrl;
      }

      console.log(`  ✅ ${film.title}`);
    } catch {
      console.log(`  ❌ ${film.title} - erro`);
    }
  }

  mkdirSync('data', { recursive: true });
  writeFileSync('data/cinema.json', JSON.stringify(films, null, 2));
  console.log(`\n💾 ${films.length} filmes guardados em data/cinema.json`);
}

scrapeCinema().catch(console.error);
