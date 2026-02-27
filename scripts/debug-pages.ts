import { chromium } from 'playwright';

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto('https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/', {
    waitUntil: 'networkidle', timeout: 20000,
  });
  await p.waitForTimeout(3000);

  // Get total pages info
  const pageInfo = await p.evaluate(() => {
    const spans = document.querySelectorAll('.pag-001-pages span, .pagination span, [class*=pag] span');
    const btns = document.querySelectorAll('[class*=pag-001] button, [class*=pag-001] a');
    return {
      spans: Array.from(spans).map(s => s.textContent?.trim()).filter(Boolean),
      btns: Array.from(btns).map(b => ({ text: (b as HTMLElement).innerText?.trim(), cls: b.className })),
    };
  });
  console.log('Page info:', JSON.stringify(pageInfo, null, 2));

  // Get all event links from page 1
  const allUrls: string[] = [];
  
  for (let page = 1; page <= 10; page++) {
    const urls = await p.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/eventos/"]');
      return Array.from(links).map(a => (a as HTMLAnchorElement).href.split('?')[0])
        .filter(h => new URL(h).pathname.match(/^\/eventos\/[^/]+\/?$/));
    });
    console.log(`Page ${page}: ${urls.length} links`);
    urls.forEach(u => { if (!allUrls.includes(u)) allUrls.push(u); });

    // Try clicking next
    const nextBtn = await p.$('button.pag-001-next:not([disabled])');
    if (!nextBtn) { console.log('No more pages'); break; }
    await nextBtn.click();
    await p.waitForTimeout(3000);
  }

  console.log(`\nTotal unique URLs: ${allUrls.length}`);
  allUrls.forEach(u => console.log(u));
  await b.close();
}

main().catch(console.error);
