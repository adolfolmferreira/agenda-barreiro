'use client';

import { useState, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────
interface Event {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  date: string;       // "2026-04-11"
  endDate?: string | null;
  time?: string;
  location: string;
  price?: string;
  description?: string;
  imageUrl?: string;
  sourceUrl?: string;
  contacts?: string;
  featured?: boolean;
}

interface Props {
  events: Event[];
  lastUpdated?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────
const MONTHS_PT: Record<number, string> = {
  0: 'Janeiro', 1: 'Fevereiro', 2: 'Março', 3: 'Abril',
  4: 'Maio', 5: 'Junho', 6: 'Julho', 7: 'Agosto',
  8: 'Setembro', 9: 'Outubro', 10: 'Novembro', 11: 'Dezembro',
};

const MONTHS_PT_SHORT: Record<number, string> = {
  0: 'Jan', 1: 'Fev', 2: 'Mar', 3: 'Abr', 4: 'Mai', 5: 'Jun',
  6: 'Jul', 7: 'Ago', 8: 'Set', 9: 'Out', 10: 'Nov', 11: 'Dez',
};

function parseDate(s: string): Date | null {
  if (!s) return null;
  const parts = s.split('-');
  if (parts.length < 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

function mkMonthKey(dateStr: string): string {
  // "2026-04-11" → "2026-04"
  return dateStr.slice(0, 7);
}

function mkMonthLabel(key: string): string {
  // "2026-04" → "Abril 2026"
  const [yStr, mStr] = key.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1; // 0-indexed
  if (isNaN(y) || isNaN(m) || !MONTHS_PT[m]) return key;
  return `${MONTHS_PT[m]} ${y}`;
}

function formatDateRange(start: string, end?: string | null): string {
  const d1 = parseDate(start);
  if (!d1) return start;
  const day1 = d1.getDate();
  const mon1 = MONTHS_PT[d1.getMonth()];
  if (!end) return `${day1} ${mon1} ${d1.getFullYear()}`;
  const d2 = parseDate(end);
  if (!d2) return `${day1} ${mon1} ${d1.getFullYear()}`;
  const day2 = d2.getDate();
  const mon2 = MONTHS_PT[d2.getMonth()];
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
    return `${day1}–${day2} ${mon1} ${d1.getFullYear()}`;
  }
  return `${day1} ${mon1} – ${day2} ${mon2} ${d2.getFullYear()}`;
}

function isEventPast(ev: Event): boolean {
  const ref = ev.endDate || ev.date;
  const d = parseDate(ref);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

// ─── Category colours ────────────────────────────────────────────
const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  Música:     { bg: '#6C3FC5', fg: '#fff' },
  Desporto:   { bg: '#D64545', fg: '#fff' },
  Exposição:  { bg: '#E8A317', fg: '#1a1a1a' },
  Teatro:     { bg: '#2D7D46', fg: '#fff' },
  Cinema:     { bg: '#1a1a1a', fg: '#fff' },
  Comunidade: { bg: '#3B82F6', fg: '#fff' },
  Feira:      { bg: '#D97706', fg: '#fff' },
  Festas:     { bg: '#EC4899', fg: '#fff' },
  default:    { bg: '#6B7280', fg: '#fff' },
};

function catColor(cat: string) {
  return CAT_COLORS[cat] || CAT_COLORS.default;
}

// ─── Component ───────────────────────────────────────────────────
export default function ClientPage({ events, lastUpdated }: Props) {
  const [selCategory, setSelCategory] = useState<string>('Todos');
  const [selMonth, setSelMonth] = useState<string>('Todos');
  const [selTimeframe, setSelTimeframe] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Derived data
  const categories = useMemo(() => {
    const s = new Set(events.map(e => e.category).filter(Boolean));
    return ['Todos', ...Array.from(s).sort()];
  }, [events]);

  const months = useMemo(() => {
    const s = new Set(events.map(e => mkMonthKey(e.date)).filter(k => k.length === 7));
    const sorted = Array.from(s).sort();
    return [{ key: 'Todos', label: 'Todos os meses' }, ...sorted.map(k => ({ key: k, label: mkMonthLabel(k) }))];
  }, [events]);

  const filtered = useMemo(() => {
    let list = [...events];
    // Timeframe
    if (selTimeframe === 'upcoming') list = list.filter(e => !isEventPast(e));
    else if (selTimeframe === 'past') list = list.filter(e => isEventPast(e));
    // Category
    if (selCategory !== 'Todos') list = list.filter(e => e.category === selCategory);
    // Month
    if (selMonth !== 'Todos') list = list.filter(e => mkMonthKey(e.date) === selMonth);
    // Sort by date ascending
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [events, selCategory, selMonth, selTimeframe]);

  // Featured event for hero
  const hero = useMemo(() => {
    const upcoming = events.filter(e => !isEventPast(e)).sort((a, b) => a.date.localeCompare(b.date));
    return upcoming.find(e => e.featured) || upcoming.find(e => e.imageUrl) || upcoming[0] || null;
  }, [events]);

  // ─── Detail overlay ──────────────────────────────────────────
  if (selectedEvent) {
    const ev = selectedEvent;
    const d = parseDate(ev.date);
    const cc = catColor(ev.category);
    return (
      <>
        {/* Styles loaded via globals.css */}
        <div style={{ minHeight: '100vh', background: '#f5f3ef' }}>
          {/* Back bar */}
          <div style={{ background: '#1a1a1a', padding: '16px 32px' }}>
            <button onClick={() => setSelectedEvent(null)}
              style={{ background: 'none', border: 'none', color: '#fff', fontFamily: 'Inter', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              ← Voltar à agenda
            </button>
          </div>

          <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
            {/* Category pill */}
            <span style={{ display: 'inline-block', background: cc.bg, color: cc.fg, fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 16 }}>
              {ev.category}
            </span>

            {/* Title */}
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.1, color: '#1a1a1a', marginBottom: 16 }}>
              {ev.title}
            </h1>

            {/* Meta row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: 15, color: '#555', marginBottom: 32, lineHeight: 1.6 }}>
              <span>📅 {formatDateRange(ev.date, ev.endDate)}</span>
              {ev.time && ev.time !== '00:00' && <span>🕐 {ev.time}</span>}
              {ev.location && <span>📍 {ev.location}</span>}
              {ev.price && <span>💰 {ev.price}</span>}
            </div>

            {/* Image */}
            {ev.imageUrl && (
              <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
                <img src={ev.imageUrl} alt={ev.title}
                  style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }} />
              </div>
            )}

            {/* Description */}
            {ev.description && (
              <div style={{ fontSize: 16, lineHeight: 1.8, color: '#333', whiteSpace: 'pre-line', marginBottom: 32 }}>
                {ev.description}
              </div>
            )}

            {/* Contacts */}
            {ev.contacts && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 32 }}>
                <h3 style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 12 }}>Contactos</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#333', whiteSpace: 'pre-line' }}>{ev.contacts}</p>
              </div>
            )}

            {/* Source link */}
            {ev.sourceUrl && (
              <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 28px', borderRadius: 8, textDecoration: 'none' }}>
                Ver no site oficial →
              </a>
            )}
          </div>
        </div>
      </>
    );
  }

  // ─── Main listing ────────────────────────────────────────────
  return (
    <>
      {/* Styles loaded via globals.css */}

      <div style={{ minHeight: '100vh' }}>
        {/* ═══ HEADER ═══ */}
        <header style={{ background: '#1a1a1a', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, background: '#6C3FC5', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, fontFamily: 'Inter' }}>B</span>
            </div>
            <span style={{ color: '#fff', fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>Agenda Barreiro</span>
          </div>
          {lastUpdated && (
            <span style={{ color: '#888', fontSize: 12 }}>
              Actualizado: {new Date(lastUpdated).toLocaleDateString('pt-PT')}
            </span>
          )}
        </header>

        {/* ═══ HERO ═══ */}
        {hero && hero.imageUrl && (
          <section
            onClick={() => setSelectedEvent(hero)}
            style={{
              position: 'relative', cursor: 'pointer', height: 'clamp(340px, 50vh, 520px)',
              backgroundImage: `url(${hero.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,.2) 50%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(24px, 4vw, 48px)', maxWidth: 1400, margin: '0 auto' }}>
              <span className="tag" style={{ background: catColor(hero.category).bg, color: catColor(hero.category).fg, marginBottom: 12 }}>
                {hero.category}
              </span>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 52px)', color: '#fff', lineHeight: 1.1, marginTop: 8, marginBottom: 8 }}>
                {hero.title}
              </h2>
              <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 15 }}>
                📅 {formatDateRange(hero.date, hero.endDate)}
                {hero.location && <> &nbsp;·&nbsp; 📍 {hero.location}</>}
              </p>
            </div>
          </section>
        )}

        {/* ═══ FILTERS ═══ */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 0' }}>
          {/* Timeframe tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['upcoming', 'all', 'past'] as const).map(t => (
              <button key={t} className={`pill-btn ${selTimeframe === t ? 'active' : ''}`}
                onClick={() => setSelTimeframe(t)}>
                {t === 'upcoming' ? 'Próximos' : t === 'past' ? 'Passados' : 'Todos'}
              </button>
            ))}
          </div>

          {/* Category + Month */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {categories.map(c => (
              <button key={c} className={`pill-btn ${selCategory === c ? 'active' : ''}`}
                onClick={() => setSelCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {months.map(m => (
              <button key={m.key} className={`pill-btn ${selMonth === m.key ? 'active' : ''}`}
                onClick={() => setSelMonth(m.key)}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
            {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
            {selCategory !== 'Todos' && <> em <strong>{selCategory}</strong></>}
            {selMonth !== 'Todos' && <> · {months.find(m => m.key === selMonth)?.label}</>}
          </p>
        </div>

        {/* ═══ EVENTS GRID ═══ */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 60px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>📭</p>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: '#888' }}>
                Sem eventos {selTimeframe === 'upcoming' ? 'próximos' : ''} nesta categoria
              </p>
            </div>
          ) : (
            <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {filtered.map(ev => {
                const d = parseDate(ev.date);
                const cc = catColor(ev.category);
                const past = isEventPast(ev);
                return (
                  <article key={ev.id} className="card" onClick={() => setSelectedEvent(ev)}
                    style={{ opacity: past ? 0.65 : 1 }}>
                    {/* Image */}
                    <div style={{ position: 'relative' }}>
                      {ev.imageUrl ? (
                        <img src={ev.imageUrl} alt={ev.title} loading="lazy" />
                      ) : (
                        <div style={{ height: 220, background: `linear-gradient(135deg, ${cc.bg}22, ${cc.bg}44)`, display: 'grid', placeItems: 'center' }}>
                          <span style={{ fontSize: 48, opacity: 0.4 }}>📅</span>
                        </div>
                      )}
                      {/* Category overlay */}
                      <span className="tag" style={{ position: 'absolute', top: 14, left: 14, background: cc.bg, color: cc.fg }}>
                        {ev.category}
                      </span>
                      {past && (
                        <span className="tag" style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,.6)', color: '#fff' }}>
                          Terminado
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="card-body">
                      {/* Date block */}
                      {d && (
                        <div className="date-block">
                          <span className="date-day">{d.getDate()}</span>
                          <div>
                            <span className="date-month">{MONTHS_PT_SHORT[d.getMonth()]}</span>
                            <span className="date-month" style={{ marginLeft: 4 }}>{d.getFullYear()}</span>
                          </div>
                        </div>
                      )}

                      <h3 className="card-title">{ev.title}</h3>

                      {ev.location && (
                        <p className="card-loc">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {ev.location.length > 50 ? ev.location.slice(0, 50) + '…' : ev.location}
                        </p>
                      )}

                      {ev.endDate && (
                        <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                          Até {(() => { const ed = parseDate(ev.endDate!); return ed ? `${ed.getDate()} ${MONTHS_PT[ed.getMonth()]}` : ''; })()}
                        </p>
                      )}

                      {ev.price && (
                        <span className="price-badge">
                          {ev.price.toLowerCase() === 'gratuito' ? '🎟 Gratuito' : `💰 ${ev.price}`}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <footer style={{ background: '#1a1a1a', color: '#888', padding: '32px 24px', textAlign: 'center', fontSize: 13 }}>
          <p style={{ marginBottom: 4 }}>Agenda Barreiro — Dados extraídos automaticamente de cm-barreiro.pt</p>
          {lastUpdated && <p>Última actualização: {new Date(lastUpdated).toLocaleString('pt-PT')}</p>}
        </footer>
      </div>
    </>
  );
}