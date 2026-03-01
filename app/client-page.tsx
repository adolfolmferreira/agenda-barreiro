'use client';

import { useState, useMemo, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────
interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  endDate?: string | null;
  time?: string;
  location: string;
  price?: string;
  description?: string;
  descriptionFull?: string;
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
const MO: Record<number, string> = {
  0:'jan', 1:'fev', 2:'mar', 3:'abr', 4:'mai', 5:'jun',
  6:'jul', 7:'ago', 8:'set', 9:'out', 10:'nov', 11:'dez',
};
const MO_FULL: Record<number, string> = {
  0:'Janeiro', 1:'Fevereiro', 2:'Março', 3:'Abril',
  4:'Maio', 5:'Junho', 6:'Julho', 7:'Agosto',
  8:'Setembro', 9:'Outubro', 10:'Novembro', 11:'Dezembro',
};

function pd(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

function fmtRange(start: string, end?: string | null): string {
  const d1 = pd(start);
  if (!d1) return '';
  const day1 = d1.getDate();
  const mon1 = MO[d1.getMonth()];
  if (!end) return `${day1} ${mon1}`;
  const d2 = pd(end);
  if (!d2) return `${day1} ${mon1}`;
  const day2 = d2.getDate();
  const mon2 = MO[d2.getMonth()];
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
    return `${day1} - ${day2} ${mon1}`;
  }
  return `${day1} ${mon1} - ${day2} ${mon2}`;
}

function fmtFull(start: string, end?: string | null): string {
  const d1 = pd(start);
  if (!d1) return start;
  const day1 = d1.getDate();
  const mon1 = MO_FULL[d1.getMonth()];
  if (!end) return `${day1} de ${mon1} de ${d1.getFullYear()}`;
  const d2 = pd(end);
  if (!d2) return `${day1} de ${mon1} de ${d1.getFullYear()}`;
  const day2 = d2.getDate();
  const mon2 = MO_FULL[d2.getMonth()];
  return `${day1} de ${mon1} – ${day2} de ${mon2} de ${d2.getFullYear()}`;
}

function mk(d: string): string { return d.slice(0, 7); }
function mkLabel(key: string): string {
  const [, m] = key.split('-').map(Number);
  return MO_FULL[m - 1] || key;
}

function isPast(ev: Event): boolean {
  const d = pd(ev.endDate || ev.date);
  if (!d) return false;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return d < t;
}

// ─── Component ───────────────────────────────────────────────────
export default function ClientPage({ events, lastUpdated }: Props) {
  const [catOpen, setCatOpen] = useState(false);
  const [monOpen, setMonOpen] = useState(false);
  const [selCat, setSelCat] = useState('Todos os Eventos');
  const currentMk = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`; const [selMon, setSelMon] = useState(currentMk);
  const [detail, setDetail] = useState<Event | null>(null);

  useEffect(() => { if (detail) window.scrollTo({ top: 0, behavior: 'smooth' }); }, [detail]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.tsl-dropdown')) {
        setCatOpen(false);
        setMonOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const categories = useMemo(() => {
    const s = new Set(events.map(e => e.category).filter(Boolean));
    return ['Todos os Eventos', ...Array.from(s).sort()];
  }, [events]);

  const months = useMemo(() => {
    const s = new Set(events.filter(e => e.date >= "2026-01-01").map(e => mk(e.date)).filter(k => k.length === 7));
    return ['Todos os Meses', ...Array.from(s).sort()];
  }, [events]);

  // Hero: next upcoming with image
  const hero = useMemo(() => {
    const upcoming = events.filter(e => e.date >= "2026-01-01" && e.imageUrl).sort((a, b) => a.date.localeCompare(b.date));
    return upcoming.find(e => e.featured) || upcoming[0] || null;
  }, [events]);

  const filtered = useMemo(() => {
    let list = events.filter(e => e.date >= "2026-01-01");
    if (selCat !== 'Todos os Eventos') list = list.filter(e => e.category === selCat);
    if (selMon !== 'Todos os Meses') list = list.filter(e => mk(e.date) === selMon);
    // Exclude hero from grid
    if (hero) list = list.filter(e => e.id !== hero.id);
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [events, selCat, selMon, hero]);

  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const ev of filtered) {
      const k = mk(ev.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // ─── DETAIL ───────────────────────────────────────────────────
  if (detail) {
    const ev = detail;
    return (
      <div className="tsl">
        <header className="tsl-head">
          <div className="tsl-head-in">
            <a className="tsl-logo" onClick={() => setDetail(null)}>
              <span className="tsl-logo-day">{new Date().getDate()}</span>
              <span className="tsl-logo-wordmark">Agenda<br/>Barreiro</span>
            </a>
            <nav className="tsl-nav">
              <a className="tsl-nav-link active" onClick={() => setDetail(null)}>Agenda</a>
            </nav>
          </div>
        </header>

        <article className="tsl-detail">
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
              {ev.location && (
                <div className="tsl-detail-meta-item">
                  <span className="tsl-detail-meta-label">Local</span>
                  <span>{ev.location}</span>
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

        <footer className="tsl-foot">
          <div className="tsl-foot-in">
            <span className="tsl-foot-brand">Agenda Barreiro</span>
            <span>Dados de cm-barreiro.pt</span>
          </div>
        </footer>
      </div>
    );
  }

  // ─── LISTING ──────────────────────────────────────────────────
  return (
    <div className="tsl">
      {/* HEADER */}
      <header className="tsl-head">
        <div className="tsl-head-in">
          <a className="tsl-logo">
            <span className="tsl-logo-day">{new Date().getDate()}</span>
            <span className="tsl-logo-wordmark">Agenda<br/>Barreiro</span>
          </a>
          <nav className="tsl-nav">
            <a className="tsl-nav-link active">Agenda</a>
          </nav>
          <div className="tsl-head-season">2025–2026</div>
        </div>
      </header>

      {/* HERO — featured event */}
      {hero && hero.imageUrl && (
        <section className="tsl-hero-feat" onClick={() => setDetail(hero)}>
          <div className="tsl-hero-feat-img">
            <img src={hero.imageUrl} alt={hero.title} />
            <div className="tsl-hero-feat-overlay" />
          </div>
          <div className="tsl-hero-feat-content">
            <div className="tsl-hero-feat-season">2025–2026</div>
            <div className="tsl-hero-feat-cat">{hero.category.toLowerCase()}</div>
            <h1 className="tsl-hero-feat-title">{hero.title}</h1>
            <div className="tsl-hero-feat-date">{fmtRange(hero.date, hero.endDate)}</div>
            {hero.location && hero.location !== 'Barreiro' && (
              <div className="tsl-hero-feat-loc">{hero.location.slice(0, 60)}</div>
            )}
          </div>
        </section>
      )}

      {/* FILTERS */}
      <div className="tsl-filters">
        <div className="tsl-filters-row">
          <div className="tsl-dropdown" onClick={() => { setCatOpen(v => !v); setMonOpen(false); }}>
            <div className="tsl-dropdown-label">Categoria</div>
            <button className="tsl-dropdown-trigger">
              {selCat}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            {catOpen && (
              <div className="tsl-dropdown-menu">
                {categories.map(c => (
                  <button key={c} className={`tsl-dropdown-item ${selCat === c ? 'active' : ''}`}
                    onClick={() => { setSelCat(c); setCatOpen(false); }}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="tsl-dropdown" onClick={() => { setMonOpen(v => !v); setCatOpen(false); }}>
            <div className="tsl-dropdown-label">Mês</div>
            <button className="tsl-dropdown-trigger">
              {selMon === 'Todos os Meses' ? selMon : mkLabel(selMon)}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            {monOpen && (
              <div className="tsl-dropdown-menu">
                {months.map(m => (
                  <button key={m} className={`tsl-dropdown-item ${selMon === m ? 'active' : ''}`}
                    onClick={() => { setSelMon(m); setMonOpen(false); }}>
                    {m === 'Todos os Meses' ? m : mkLabel(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EVENTS — grouped by month, 4-column grid */}
      <main className="tsl-main">
        {grouped.length === 0 && (
          <div className="tsl-empty"><p>Sem eventos encontrados</p></div>
        )}

        {grouped.map(([mkey, evts]) => (
          <section key={mkey} className="tsl-month">
            <h2 className="tsl-month-title">{mkLabel(mkey)}</h2>
            <div className="tsl-grid">
              {evts.map(ev => (
                <a key={ev.id} className="tsl-card" onClick={() => setDetail(ev)}>
                  <div className="tsl-card-img">
                    {ev.imageUrl ? (
                      <img src={ev.imageUrl} alt={ev.title} loading="lazy" />
                    ) : (
                      <div className="tsl-card-noimg" />
                    )}
                    <div className="tsl-card-img-over" />
                  </div>
                  <div className="tsl-card-body">
                    <span className="tsl-card-date">{fmtRange(ev.date, ev.endDate)}</span>
                    <span className="tsl-card-cat">{ev.category.toLowerCase()}</span>
                    <h3 className="tsl-card-title">{ev.title}</h3>
                    {ev.location && ev.location !== 'Barreiro' && (
                      <span className="tsl-card-loc">
                        {ev.location.length > 50 ? ev.location.slice(0, 50) + '…' : ev.location}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        {grouped.length > 2 && (
          <div className="tsl-backtop">
            <a onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Voltar ao topo da página</a>
          </div>
        )}
      </main>

      {/* EDIÇÕES PDF */}
      <section className="tsl-pdf">
        <h2 className="tsl-pdf-heading">edição em pdf</h2>
        <div className="tsl-pdf-grid">
          {[
            { title: 'março / abril 2026', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/710x480px_agenda2830_noticias-1.jpg', url: 'https://www.cm-barreiro.pt/agenda-de-eventos-marco-abril-2026-ja-disponivel/' },
            { title: 'janeiro / fevereiro 2026', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/710x480px_agenda2830_noticias-1.jpg', url: 'https://www.cm-barreiro.pt/agenda-de-eventos-2830-janeiro-fevereiro-2026-ja-disponivel/' },
            { title: 'especial natal 2025', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/710x480px_agenda2830_noticias.jpg', url: 'https://www.cm-barreiro.pt/agenda-de-eventos-2830-especial-natal-2025-ja-disponivel/' },
            { title: 'novembro / dezembro 2025', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/10/710x480px_agenda2830_noticias-4.jpg', url: 'https://www.cm-barreiro.pt/agenda-de-eventos-novembro-dezembro-2025-ja-disponivel/' },
            { title: 'setembro / outubro 2025', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/08/710x480px_agenda2830_noticias.jpg', url: 'https://www.cm-barreiro.pt/agenda-de-eventos-2830-setembro-outubro-2025-ja-disponivel/' },
            { title: 'julho / agosto 2025', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/06/710x480px_agenda2830_noticias-1.jpg', url: 'https://www.cm-barreiro.pt/agenda-de-eventos-2830-julho-agosto-2025-ja-disponivel-2/' },
          ].map((ed, i) => (
            <a key={i} className="tsl-pdf-item" href={ed.url} target="_blank" rel="noopener noreferrer">
              <div className="tsl-pdf-label">{ed.title}</div>
              <div className="tsl-pdf-cover">
                <img src={ed.img} alt={`Agenda ${ed.title}`} loading="lazy" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="tsl-foot">
        <div className="tsl-foot-in">
          <span className="tsl-foot-brand">Agenda Barreiro</span>
          <span>Dados extraídos automaticamente de cm-barreiro.pt</span>
          {lastUpdated && <span>Última actualização: {new Date(lastUpdated).toLocaleDateString('pt-PT')}</span>}
        </div>
      </footer>
    </div>
  );
}