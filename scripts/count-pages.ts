import { chromium } from 'playwright';

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto('https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/', {
    waitUntil: 'networkidle', timeout: 20000,
  });
  await p.waitForTimeout(3000);
  try { await p.locator('text=Aceitar tudo').click({ timeout: 2000 }); } catch {}
  await p.waitForTimeout(1000);

  let pageNum = 1;
  const allUrls = new Set<string>();

  while (pageNum <= 30) {
    const urls = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/eventos/"]'))
        .map(a => (a as HTMLAnchorElement).href.split('?')[0])
        .filter(h => new URL(h).pathname.match(/^\/eventos\/[^/]+\/?$/));
    });
    urls.forEach(u => allUrls.add(u));
    console.log(`Page ${pageNum}: ${urls.length} links, total unique: ${allUrls.size}`);

    const next = await p.$('button.pag-001-next:not(.pag-arrow--disabled)');
    if (!next) { console.log('DONE - no more pages'); break; }
    await next.click();
    await p.waitForTimeout(2500);
    pageNum++;
  }

  // Print all URLs with year info
  const sorted = Array.from(allUrls).sort();
  sorted.forEach(u => {
    const yearMatch = u.match(/20(\d{2})/);
    const yr = yearMatch ? '20' + yearMatch[1] : 'no-year';
    console.log(`  [${yr}] ${u.split('/eventos/')[1]}`);
  });

  console.log(`\nTotal unique: ${allUrls.size}`);
  await b.close();
}

main().catch(console.error);
