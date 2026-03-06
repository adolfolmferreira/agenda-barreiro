import { writeFileSync, mkdirSync } from 'fs';

async function scrapeCinema() {
  console.log('🎬 Scraping cinema from Castello Lopes API (Barra Shopping Barreiro)...\n');

  // Get available dates from the page
  const pageRes = await fetch('https://castellolopescinemas.pt/barra-shopping-barreiro/', {
    signal: AbortSignal.timeout(15000),
  });
  const pageHtml = await pageRes.text();

  const dates: string[] = [];
  const dateRe = /value="(\d{4}-\d{2}-\d{2})"/g;
  let dm: RegExpExecArray | null;
  while ((dm = dateRe.exec(pageHtml)) !== null) {
    if (!dates.includes(dm[1])) dates.push(dm[1]);
  }
  console.log(`📅 ${dates.length} datas com sessões: ${dates[0]} → ${dates[dates.length - 1]}\n`);

  // Fetch sessions for all dates to get complete film list
  const filmMap = new Map<string, { title: string; url: string; img: string; genre: string; duration: string; rating: string; sessions: string[] }>();

  for (const date of dates) {
    try {
      const res = await fetch(`https://castellolopescinemas.pt/wp-json/sessions/cinema?cinema=Forum%20Barreiro&date=${date}`, {
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();

      for (const movie of data) {
        if (!filmMap.has(movie.title)) {
          filmMap.set(movie.title, {
            title: movie.title,
            url: movie.guid.replace(/&#038;/g, '&'),
            img: movie.thumb || movie.poster_url || '',
            genre: movie.genre || '',
            duration: movie.duration || '',
            rating: movie.rating || '',
            sessions: [],
          });
        }
        const film = filmMap.get(movie.title)!;
        film.sessions.push(`${date}: ${movie.sessions}`);
      }
    } catch (e) {
      console.log(`  ❌ Erro a buscar sessões para ${date}`);
    }
  }

  const films = Array.from(filmMap.values()).map(f => ({
    title: f.title,
    url: f.url,
    img: f.img,
    genre: f.genre,
    duration: f.duration,
    rating: f.rating,
  }));

  for (const f of films) {
    console.log(`  ✅ ${f.title} (${f.genre})`);
  }

  mkdirSync('data', { recursive: true });
  writeFileSync('data/cinema.json', JSON.stringify(films, null, 2));
  console.log(`\n💾 ${films.length} filmes em exibição guardados em data/cinema.json`);
}

scrapeCinema().catch(console.error);
