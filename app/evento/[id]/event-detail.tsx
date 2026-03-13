'use client';

import Link from 'next/link';
import type { Event } from '../../components/types';
import { fmtFull, cleanLoc } from '../../components/helpers';

function decodeHtml(s: string): string {
  return s
    .replace(/&aacute;/g,'á').replace(/&eacute;/g,'é').replace(/&iacute;/g,'í')
    .replace(/&oacute;/g,'ó').replace(/&uacute;/g,'ú').replace(/&atilde;/g,'ã')
    .replace(/&otilde;/g,'õ').replace(/&ccedil;/g,'ç').replace(/&Aacute;/g,'Á')
    .replace(/&Eacute;/g,'É').replace(/&Iacute;/g,'Í').replace(/&Oacute;/g,'Ó')
    .replace(/&Uacute;/g,'Ú').replace(/&Atilde;/g,'Ã').replace(/&Otilde;/g,'Õ')
    .replace(/&Ccedil;/g,'Ç').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ')
    .replace(/&euro;/g,'€').replace(/&ldquo;/g,'\u201c').replace(/&rdquo;/g,'\u201d')
    .replace(/&ndash;/g,'–').replace(/&mdash;/g,'—').replace(/&hellip;/g,'…')
    .replace(/&ordm;/g,'º').replace(/&ordf;/g,'ª').replace(/&acirc;/g,'â')
    .replace(/&ecirc;/g,'ê').replace(/&ocirc;/g,'ô').replace(/&agrave;/g,'à')
    .replace(/&rsquo;/g,'\u2019').replace(/&lsquo;/g,'\u2018')
    .replace(/&raquo;/g,'»').replace(/&laquo;/g,'«')
    .replace(/&#8211;/g,'–').replace(/&#8220;/g,'\u201c').replace(/&#8221;/g,'\u201d')
    .replace(/&#8216;/g,'\u2018').replace(/&#8217;/g,'\u2019').replace(/&#8230;/g,'…');
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
          {ev.price && (
            <div className="tsl-detail-meta-item">
              <span className="tsl-detail-meta-label">Preço</span>
              <span>{decodeHtml(ev.price)}</span>
            </div>
          )}


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
