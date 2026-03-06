'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Event } from './components/types';
import { fmtRange, cleanLoc } from './components/helpers';

function getDominantColor(imgUrl: string): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 50; canvas.height = 50;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve([16, 31, 42]); return; }
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        resolve([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
      } catch { resolve([16, 31, 42]); }
    };
    img.onerror = () => resolve([16, 31, 42]);
    img.src = imgUrl;
  });
}

function isLight(r: number, g: number, b: number): boolean {
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

function HighlightsSection({ highlights }: { highlights: Event[] }) {
  const [bg, setBg] = useState("rgb(16, 31, 42)");
  const [textColor, setTextColor] = useState("#fff");

  useEffect(() => {
    const imgUrl = highlights.find(e => e.imageUrl)?.imageUrl;
    if (imgUrl) {
      getDominantColor(imgUrl).then(([r, g, b]) => {
        setBg(`rgb(${r}, ${g}, ${b})`);
        setTextColor(isLight(r, g, b) ? "rgb(16, 31, 42)" : "#fff");
      });
    }
  }, [highlights]);

  return (
    <section className="tsl-highlights" style={{ backgroundColor: bg, color: textColor }}>
      <h2 className="tsl-highlights-title" style={{ color: textColor }}>Em Destaque</h2>
      <div className="tsl-highlights-grid">
        {highlights.map(ev => (
          <Link key={ev.id} href={`/evento/${ev.id}`} className="tsl-highlight-card">
            <div className="tsl-highlight-info">
              <span className="tsl-highlight-cat" style={{ color: textColor, opacity: 0.7 }}>{ev.category.toLowerCase()}</span>
              <h3 className="tsl-highlight-name" style={{ color: textColor }}>{ev.title.length > 33 ? ev.title.slice(0, 33) + "…" : ev.title}</h3>
            </div>
            {ev.imageUrl && <img className="tsl-highlight-img" src={ev.imageUrl} alt={ev.title} />}
          </Link>
        ))}
      </div>
    </section>
  );
}

function PdfCover({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const proxyUrl = `/api/pdf-cover?url=${encodeURIComponent(url)}`;
    const loadPdf = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
        const pdf = await pdfjsLib.getDocument(proxyUrl).promise;
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const viewport = page.getViewport({ scale: 1 });
        const scale = canvas.clientWidth / viewport.width;
        const scaled = page.getViewport({ scale });
        canvas.width = scaled.width;
        canvas.height = scaled.height;
        await page.render({ canvasContext: ctx, viewport: scaled }).promise;
        if (!cancelled) setLoaded(true);
      } catch (e) { console.error('PDF render error:', e); }
    };
    loadPdf();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <canvas ref={canvasRef} className="tsl-pdf-canvas"
      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }} />
  );
}

export default function HomeClient({ events }: { events: Event[] }) {
  const [cinema, setCinema] = useState<{title: string; url: string; img: string}[]>([]);

  useEffect(() => {
    fetch('/api/cinema').then(r => r.json()).then(setCinema).catch(() => {});
  }, []);

  const highlights = events.filter(e => ["antonio-zambujo-concerto-2026-03-21", "viagem-a-lisboa-um-espetaculo-d-o-clube-2026-03-14"].includes(e.id));

  // Next upcoming events for preview
  const upcoming = events
    .filter(e => e.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <>
      {highlights.length > 0 && <HighlightsSection highlights={highlights} />}

      {cinema.length > 0 && (
        <section className="tsl-cinema">
          <div className="tsl-cinema-header">
            <h2 className="tsl-cinema-title">No Cinema</h2>
            <a className="tsl-cinema-link" href="https://castellolopescinemas.pt/barra-shopping-barreiro/" target="_blank" rel="noopener noreferrer">Ver tudo →</a>
          </div>
          <div className="tsl-cinema-slider">
            {cinema.map((film, i) => (
              <a key={i} className="tsl-cinema-card" href={film.url} target="_blank" rel="noopener noreferrer">
                {film.img && <img className="tsl-cinema-poster" src={film.img} alt={film.title} loading="lazy" />}
                <span className="tsl-cinema-name">{film.title}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Próximos eventos */}
      {upcoming.length > 0 && (
        <section className="tsl-upcoming">
          <div className="tsl-upcoming-header">
            <h2 className="tsl-upcoming-title">Próximos Eventos</h2>
            <Link href="/agenda" className="tsl-upcoming-link">Ver agenda completa →</Link>
          </div>
          <div className="tsl-grid">
            {upcoming.map(ev => (
              <Link key={ev.id} href={`/evento/${ev.id}`} className="tsl-card">
                <div className="tsl-card-img">
                  {ev.imageUrl ? <img src={ev.imageUrl} alt={ev.title} loading="lazy" /> : <div className="tsl-card-noimg" />}
                  <div className="tsl-card-img-over" />
                </div>
                <div className="tsl-card-body">
                  <span className="tsl-card-date">{fmtRange(ev.date, ev.endDate)}</span>
                  <span className="tsl-card-cat">{ev.category.toLowerCase()}</span>
                  <h3 className="tsl-card-title">{ev.title}</h3>
                  {ev.location && ev.location !== "Barreiro" && cleanLoc(ev.location) && (
                    <span className="tsl-card-loc">{cleanLoc(ev.location)}</span>
                  )}
                  <span className="tsl-card-more">Ver Mais →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Edições PDF */}
      <section className="tsl-pdf">
        <h2 className="tsl-pdf-heading">edição em pdf</h2>
        <div className="tsl-pdf-grid">
          {[
            { title: 'março / abril 2026', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2026/02/agenda2830-Barreiro_mar_abr_2026.pdf' },
            { title: 'janeiro / fevereiro 2026', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/agenda2830_jan_fev_2026.pdf' },
            { title: 'especial natal 2025', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/Agenda-2830_Natal_25-1.pdf' },
            { title: 'novembro / dezembro 2025', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/10/agenda2830_nov_dez_2025.pdf' },
            { title: 'setembro / outubro 2025', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/08/agenda2830_set-out-2025.pdf' },
            { title: 'julho / agosto 2025', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/06/agenda2830_julho_agosto_2025_editavelFINAL.pdf' },
          ].map((ed, i) => (
            <a key={i} className="tsl-pdf-item" href={ed.pdf} target="_blank" rel="noopener noreferrer">
              <div className="tsl-pdf-label">{ed.title}</div>
              <div className="tsl-pdf-cover">
                <PdfCover url={ed.pdf} />
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
