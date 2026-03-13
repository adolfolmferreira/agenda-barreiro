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
    .replace(/&euro;/g,'€').replace(/&ldquo;/g,'"').replace(/&rdquo;/g,'"')
    .replace(/&ndash;/g,'–').replace(/&mdash;/g,'—').replace(/&hellip;/g,'…')
    .replace(/&ordm;/g,'º').replace(/&ordf;/g,'ª').replace(/&acirc;/g,'â')
    .replace(/&ecirc;/g,'ê').replace(/&ocirc;/g,'ô').replace(/&agrave;/g,'à')
    .replace(/&#8211;/g,'–').replace(/&#8220;/g,'"').replace(/&#8221;/g,'"')
    .replace(/&#8230;/g,'…');
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
        <h1 className="tsl-detail-title">{ev.title}</h1>
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
          {ev.location && cleanLoc(ev.location) && (
            <div className="tsl-detail-meta-item">
              <span className="tsl-detail-meta-label">Local</span>
              <span>{cleanLoc(ev.location)}</span>
            </div>
          )}
          {ev.price && (
            <div className="tsl-detail-meta-item">
              <span className="tsl-detail-meta-label">Preço</span>
              <span>{ev.price}</span>
            </div>
          )}
        </div>
        {(ev.descriptionFull || ev.description) && (
          <div className="tsl-detail-text">
            {decodeHtml(ev.descriptionFull || ev.description || '').split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        {ev.sourceUrl && (
          <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="tsl-detail-cta">
            Ver no site oficial →
          </a>
        )}
      </div>
    </article>
  );
}
