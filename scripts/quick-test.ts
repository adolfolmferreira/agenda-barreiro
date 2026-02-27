import { chromium } from 'playwright';

async function main() {
  const urls = [
    'https://www.cm-barreiro.pt/eventos/circuito-de-torneios-de-xadrez-do-barreiro-2026/',
    'https://www.cm-barreiro.pt/eventos/barreiro-machada-trail-noturno-2026/',
    'https://www.cm-barreiro.pt/eventos/exposicao-cem-peixes/',
    'https://www.cm-barreiro.pt/eventos/exposicao-oleandras/',
    'https://www.cm-barreiro.pt/eventos/2o-festival-de-bebes-circuito-de-natacao-do-barreiro-2025-2026/',
    'https://www.cm-barreiro.pt/eventos/hora-do-conto-com-pozinhos-de-perlimpimpi-do-inicio-ao-fim-de-ana-frias-fev2026/',
    'https://www.cm-barreiro.pt/eventos/cria-o-teu-projeto-2026/',
    'https://www.cm-barreiro.pt/eventos/carnaval-das-escolas-2026-desfiles/',
  ];

  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();

  for (const url of urls) {
    try {
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await p.waitForTimeout(1000);
      const title = await p.$eval('h1', el => el.textContent?.trim().replace(/\s+/g,' ').replace(/Atualizado.*/,'').trim()).catch(() => 'NO H1');
      console.log(title + ' -> ' + url.split('/eventos/')[1]);
    } catch(e: any) {
      console.log('FAIL: ' + url.split('/eventos/')[1] + ' ' + e.message.slice(0,50));
    }
  }

  await b.close();
}

main().catch(console.error);
