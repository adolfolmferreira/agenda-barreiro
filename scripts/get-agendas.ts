import { chromium } from 'playwright';

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto('https://www.cm-barreiro.pt/participar/publicacoes-municipais/agendas/agenda-de-eventos-2830/', {
    waitUntil: 'networkidle', timeout: 20000,
  });
  await p.waitForTimeout(3000);
  try { await p.locator('text=Aceitar tudo').click({ timeout: 2000 }); } catch {}
  await p.waitForTimeout(1000);

  // Scroll to load all
  for (let i = 0; i < 10; i++) {
    await p.mouse.wheel(0, 600);
    await p.waitForTimeout(300);
  }

  // Get all PDF links with nearby images
  const items = await p.evaluate(() => {
    const results: { title: string; pdfUrl: string; imgUrl: string }[] = [];
    // Look for links to PDFs
    const pdfLinks = document.querySelectorAll('a[href*=".pdf"]');
    pdfLinks.forEach(a => {
      const href = (a as HTMLAnchorElement).href;
      const text = (a as HTMLElement).innerText?.trim() || '';
      // Find nearby image
      const parent = a.closest('div, li, article, figure');
      const img = parent?.querySelector('img');
      const imgUrl = img?.src || img?.getAttribute('data-src') || '';
      results.push({ title: text || href.split('/').pop() || '', pdfUrl: href, imgUrl });
    });

    // Also look for images that might be covers
    const allImgs = document.querySelectorAll('img[src*="agenda"], img[src*="2830"], img[src*="capa"]');
    allImgs.forEach(img => {
      const src = (img as HTMLImageElement).src;
      if (!results.some(r => r.imgUrl === src)) {
        const parent = img.closest('a');
        const href = parent?.href || '';
        results.push({ title: '', pdfUrl: href, imgUrl: src });
      }
    });

    return results;
  });

  console.log(JSON.stringify(items, null, 2));

  // Also get main content text
  const text = await p.evaluate(() => {
    const main = document.querySelector('main, .entry-content, article, .content');
    return main?.innerText?.slice(0, 3000) || document.body.innerText.slice(0, 3000);
  });
  console.log('\n=== MAIN TEXT ===\n', text.slice(0, 2000));

  await b.close();
}

main().catch(console.error);
