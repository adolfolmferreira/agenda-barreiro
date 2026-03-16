'use client';

import Link from 'next/link';
import type { Event } from '../../components/types';
import { fmtFull, cleanLoc } from '../../components/helpers';

function decodeHtml(s: string): string {
  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.innerHTML = s;
    return el.value;
  }
  return s
    .replace(/&[a-z]+;/gi, m => {
      const map: Record<string, string> = {
        '&aacute;':'á','&Aacute;':'Á','&eacute;':'é','&Eacute;':'É',
        '&iacute;':'í','&Iacute;':'Í','&oacute;':'ó','&Oacute;':'Ó',
        '&uacute;':'ú','&Uacute;':'Ú','&atilde;':'ã','&Atilde;':'Ã',
        '&otilde;':'õ','&Otilde;':'Õ','&ccedil;':'ç','&Ccedil;':'Ç',
        '&acirc;':'â','&Acirc;':'Â','&ecirc;':'ê','&Ecirc;':'Ê',
        '&ocirc;':'ô','&Ocirc;':'Ô','&agrave;':'à','&Agrave;':'À',
        '&amp;':'&','&nbsp;':' ','&euro;':'€','&ordm;':'º','&ordf;':'ª',
        '&ldquo;':'"','&rdquo;':'"','&lsquo;':"'",'&rsquo;':"'",
        '&ndash;':'–','&mdash;':'—','&hellip;':'…',
        '&raquo;':'»','&laquo;':'«',
      };
      return map[m.toLowerCase()] || m;
    })
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function linkify(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const re = /(https?:\/\/[^\s,;)]+|www\.[^\s,;)]+|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const raw = match[0];
    if (raw.includes('@')) {
      parts.push(
        <a key={key++} href={`mailto:${raw}`} className="tsl-detail-link">{raw}</a>
      );
    } else {
      const href = raw.startsWith('http') ? raw : `https://${raw}`;
      parts.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="tsl-detail-link">{raw}</a>
      );
    }
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function RichText({ text }: { text: string }) {
  const decoded = decodeHtml(text);
  const paragraphs = decoded.split('\n\n').filter(p => p.trim());

  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{linkify(p)}</p>
      ))}
    </>
  );
}

export default function EventDetail({ event }: { event: Event | null }) {
  if (!event) {
    return (
      <div className="tsl-empty" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h1>Evento não encontrado</h1>
        <Link href="/agenda" style={{ marginTop: '1rem', display: 'inline-block' }}>← Voltar à agenda</Link>
      </div>
    );
  }

  const ev = event;
  const loc = ev.location ? cleanLoc(decodeHtml(ev.location)) : '';

  return (
    <article className="tsl-detail">
      <Link href="/agenda" className="tsl-back-btn">← Voltar</Link>
      {ev.imageUrl && (
        <div className="tsl-detail-hero">
          <img src={ev.imageUrl} alt={ev.title} />
        </div>
      )}
      <div className="tsl-detail-body">
        <div className="tsl-detail-cat">{ev.category.toLowerCase()}</div>
        <h1 className="tsl-detail-title">{decodeHtml(ev.title)}</h1>

        <div className="tsl-detail-meta">
          <div className="tsl-detail-meta-item">
            <span className="tsl-detail-meta-label">Data</span>
            <span>{fmtFull(ev.date, ev.endDate)}</span>
          </div>
          {ev.time && ev.time !== '00:00' && (
            <div className="tsl-detail-meta-item">
              <span className="tsl-detail-meta-label">Hora</span>
              <span>{ev.time}</span>
            </div>
          )}
          {loc && (
            <div className="tsl-detail-meta-item">
              <span className="tsl-detail-meta-label">Local</span>
              <span>{loc}</span>
            </div>
          )}
          <div className="tsl-detail-meta-item">
            <span className="tsl-detail-meta-label">Preço</span>
            <span>{ev.price ? decodeHtml(ev.price) : 'Gratuito'}</span>
          </div>


        </div>

        {(ev.descriptionFull || ev.description) && (
          <div className="tsl-detail-text">
            <RichText text={ev.descriptionFull || ev.description || ''} />
          </div>
        )}

        {ev.sourceUrl && (
          <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="tsl-detail-cta">
            Ver no site oficial →
          </a>
        )}

        {loc && loc !== 'Barreiro' && (
          <div className="tsl-detail-map">
            <h2 className="tsl-detail-map-title">Localização</h2>
            <iframe
              className="tsl-detail-map-iframe"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(loc + ', Barreiro, Portugal')}`}
              allowFullScreen
            />
          </div>
        )}
      </div>
    </article>
  );
}
