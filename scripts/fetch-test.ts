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

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const html = await res.text();
      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').replace(/Atualizado.*/i,'').trim() : 'NO TITLE';
      const ogImg = html.match(/og:image[^>]+content="([^"]+)"/)?.[1] || '';
      console.log(`OK: ${title}`);
      if (ogImg) console.log(`   img: ${ogImg.slice(0,80)}`);
    } catch(e: any) {
      console.log(`FAIL: ${url.split('/eventos/')[1]} - ${e.message.slice(0,40)}`);
    }
  }
}

main();
