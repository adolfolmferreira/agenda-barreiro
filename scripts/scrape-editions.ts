import { writeFileSync, mkdirSync } from 'fs';

async function scrapeEditions() {
  console.log('📄 Scraping PDF editions...');

  // Search for edition pages
  const res = await fetch('https://www.cm-barreiro.pt/wp-json/wp/v2/posts?search=agenda+de+eventos+disponivel&per_page=20', {
    signal: AbortSignal.timeout(15000),
  });
  const posts = await res.json();

  const editions: { title: string; img: string; pdf: string; url: string; date: string }[] = [];

  for (const post of posts) {
    const link: string = post.link;
    const name: string = post.title.rendered;

    // Only process agenda 2830 editions
    if (!/agenda.*evento/i.test(name) || /junior/i.test(name)) continue;

    try {
      // Fetch the page to get cover image
      const r = await fetch(link, { signal: AbortSignal.timeout(10000) });
      const h = await r.text();

      // Get gallery cover image
      const imgs = (h.match(/https:\/\/www\.cm-barreiro\.pt\/wp-content\/uploads\/[^"\s]+galeria[^"\s]+\.jpg/gi) || [])
        .filter((i: string) => i.indexOf('-300x') === -1 && i.indexOf('-768x') === -1 && i.indexOf('-1024x') === -1 && i.indexOf('-1536x') === -1);
      const img = Array.from(new Set(imgs))[0] || '';

      // Get PDF - first try from page, then guess URL
      let pdfs = (h.match(/https:\/\/www\.cm-barreiro\.pt\/wp-content\/uploads\/[^"\s]+\.pdf/gi) || [])
        .filter((p: string) => /agenda/i.test(p));
      let pdf = pdfs[0] || '';

      // If no PDF found on page, try to guess from upload path pattern
      if (!pdf && img) {
        const uploadPath = img.match(/uploads\/(\d{4})\/(\d{2})\//);
        if (uploadPath) {
          const [, year, month] = uploadPath;
          // Extract month names from title
          const monthNames = name.match(/(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|natal)/gi) || [];
          const shortMonths: Record<string, string> = {
            janeiro: 'jan_fev', fevereiro: 'jan_fev', março: 'mar_abr', marco: 'mar_abr',
            abril: 'mar_abr', maio: 'maio_junho', junho: 'maio_junho',
            julho: 'julho_agosto', agosto: 'julho_agosto', setembro: 'set-out',
            outubro: 'set-out', novembro: 'nov_dez', dezembro: 'nov_dez', natal: 'Natal',
          };
          // Try common patterns
          const base = `https://www.cm-barreiro.pt/wp-content/uploads/${year}/${month}/`;
          const guesses = [
            `agenda2830_${shortMonths[monthNames[0]?.toLowerCase() || ''] || 'unknown'}_${year}.pdf`,
            `agenda2830-Barreiro_${shortMonths[monthNames[0]?.toLowerCase() || ''] || 'unknown'}_${year}.pdf`,
            `Agenda-2830_${shortMonths[monthNames[0]?.toLowerCase() || ''] || 'unknown'}_${year}.pdf`,
          ];
          for (const g of guesses) {
            try {
              const check = await fetch(base + g, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
              if (check.status === 200) { pdf = base + g; break; }
            } catch {}
          }
        }
      }

      // Extract a sortable date from the post
      const postDate: string = post.date || '';

      editions.push({ title: extractTitle(name), img, pdf, url: link, date: postDate });
      console.log(`  ✓ ${extractTitle(name)} (img: ${img ? 'yes' : 'no'}, pdf: ${pdf ? 'yes' : 'no'})`);
    } catch {
      console.log(`  ✗ ${name} - error`);
    }
  }

  // Sort by date descending (newest first)
  editions.sort((a, b) => b.date.localeCompare(a.date));

  // Clean: remove junior editions, fix known PDFs, deduplicate
  const seen = new Set<string>();
  const cleaned = editions.filter(e => {
    if (/junior/i.test(e.title) || /junior/i.test(e.url)) return false;
    if (seen.has(e.title)) return false;
    seen.add(e.title);
    return true;
  });
  // Fix known missing PDFs
  for (const e of cleaned) {
    if (/janeiro.*fevereiro.*2026/i.test(e.title) && !e.pdf) {
      e.pdf = 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/agenda2830_jan_fev_2026.pdf';
    }
    if (e.title === 'natal / 2025') e.title = 'especial natal 2025';
  }

  mkdirSync('data', { recursive: true });
  writeFileSync('data/editions.json', JSON.stringify(cleaned.slice(0, 12), null, 2));
  console.log(`\n✅ Saved ${Math.min(editions.length, 6)} editions to data/editions.json`);
}

function extractTitle(name: string): string {
  // "Agenda de Eventos 2830 maio/junho 2026 já disponível" → "maio / junho 2026"
  const m = name.match(/(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|natal)[\/\s]*([\w]*)\s*(\d{4})/i);
  if (m) return `${m[1]} / ${m[2]} ${m[3]}`.replace(/\s+/g, ' ').toLowerCase();
  const m2 = name.match(/(especial\s+natal|natal)\s*(\d{4})/i);
  if (m2) return `especial natal ${m2[2]}`;
  return name.replace(/Agenda de Eventos 2830|já disponível/gi, '').trim().toLowerCase();
}

scrapeEditions().catch(console.error);
