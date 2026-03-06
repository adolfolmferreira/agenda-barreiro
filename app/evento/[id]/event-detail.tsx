'use client';

import Link from 'next/link';
import type { Event } from '../../components/types';
import { fmtFull, cleanLoc } from '../../components/helpers';

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
            {(ev.descriptionFull || ev.description || '').split('\n\n').map((p, i) => (
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
