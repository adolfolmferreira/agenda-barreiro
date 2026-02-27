import { chromium } from 'playwright';

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto('https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(5000);
  for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, 800); await p.waitForTimeout(500); }
  await p.screenshot({ path: 'debug-agenda.png', fullPage: true });
  const links = await p.$$eval('a[href*="/eventos/"]', els => els.map(a => ({ href: a.href, text: (a.textContent || '').trim().slice(0, 80) })));
  console.log(JSON.stringify(links, null, 2));
  const mainText = await p.evaluate(() => document.body.innerText.slice(0, 5000));
  console.log('\n=== MAIN TEXT ===\n', mainText);
  await b.close();
}

main().catch(console.error);
