'use client';

import { useState, useMemo, useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';

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
function cleanLoc(s: string): string {
  let c = s.replace(/^(Ponto de encontro:|Partida:)\s*/i, "");
  c = c.split(/\d|Organização|\sM\/|\sO\s[A-Z]|\sEntre\s|\se\s[a-z]|\sPara\s|\sRua\s|\sa\s[a-z]|Horário|\sOrg[.:]|\sUm\s|A mostra|vai\s|realidade|Inscrição|Info|Preço|Duração|Público|Domingos|tudo pode|a criatividade|a dança|No próximo|Em parceria|às\s/i)[0].trim();
  if (c.length < 5) return "";
  return c.length > 50 ? c.slice(0, 50) + "…" : c;
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


function PdfCover({ url }: { url: string }) {
  const proxyUrl = `/api/pdf-cover?url=${encodeURIComponent(url)}`;
  return (
    <iframe
      src={`${proxyUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
      className="tsl-pdf-iframe"
      title="PDF Cover"
    />
  );
}

function getDominantColor(imgUrl: string): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve([16, 31, 42]); return; }
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        resolve([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
      } catch {
        resolve([16, 31, 42]);
      }
    };
    img.onerror = () => resolve([16, 31, 42]);
    img.src = imgUrl;
  });
}

function isLight(r: number, g: number, b: number): boolean {
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

function HighlightsSection({ highlights, onSelect }: { highlights: Event[]; onSelect: (ev: Event) => void }) {
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
      <h2 className="tsl-highlights-title" style={{ color: textColor }}>{String("Em Destaque")}</h2>
      <div className="tsl-highlights-grid">
        {highlights.map(ev => (
          <div key={ev.id} className="tsl-highlight-card" onClick={() => onSelect(ev)}>
            <div className="tsl-highlight-info">
              <span className="tsl-highlight-cat" style={{ color: textColor, opacity: 0.7 }}>{ev.category.toLowerCase()}</span>
              <h3 className="tsl-highlight-name" style={{ color: textColor }}>{ev.title.length > 33 ? ev.title.slice(0, 33) + "…" : ev.title}</h3>
            </div>
            {ev.imageUrl && <img className="tsl-highlight-img" src={ev.imageUrl} alt={ev.title} />}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ClientPage({ events, lastUpdated }: Props) {
  const [catOpen, setCatOpen] = useState(false);
  const [monOpen, setMonOpen] = useState(false);
  const [selCat, setSelCat] = useState('Todos os Eventos');
  const [selMon, setSelMon] = useState('Todos os Meses');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cinema, setCinema] = useState<{title: string; url: string; img: string}[]>([]);

  useEffect(() => {
    fetch('/api/cinema').then(r => r.json()).then(setCinema).catch(() => {});
  }, []);
  const [page, setPageState] = useState<'home' | 'agenda'>('home');

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/agenda') setPageState('agenda');
    else if (path.startsWith('/evento/')) {
      const id = path.replace('/evento/', '');
      const ev = events.find(e => e.id === id);
      if (ev) setDetailState(ev);
    }
  }, []);
  const setPage = (p: 'home' | 'agenda') => {
    setPageState(p);
    window.history.pushState({}, '', p === 'home' ? '/' : '/agenda');
  };
  const [detail, setDetailState] = useState<Event | null>(null);
  const setDetail = (ev: Event | null) => {
    setDetailState(ev);
    if (ev) {
      window.history.pushState({}, '', `/evento/${ev.id}`);
    } else {
      window.history.pushState({}, '', page === 'agenda' ? '/agenda' : '/');
    }
  };

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      if (path.startsWith('/evento/')) {
        const id = path.replace('/evento/', '');
        const ev = events.find(e => e.id === id);
        if (ev) { setDetailState(ev); return; }
      }
      setDetailState(null);
      setPageState(path === '/agenda' ? 'agenda' : 'home');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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
    const s = new Set(events.filter(e => e.date >= "2026-01-01" && e.date <= "2026-06-30").map(e => mk(e.date)).filter(k => k.length === 7));
    return ['Todos os Meses', ...Array.from(s).sort().reverse()];
  }, [events]);

  // Hero: next upcoming with image
  const hero = useMemo(() => {
    const upcoming = events.filter(e => e.date >= "2026-01-01" && e.imageUrl).sort((a, b) => a.date.localeCompare(b.date));
    return upcoming.find(e => e.featured) || upcoming[0] || null;
  }, [events]);

  const filtered = useMemo(() => {
    let list = events.filter(e => e.date >= "2026-01-01" && e.date <= "2026-06-30");
    if (selCat !== 'Todos os Eventos') list = list.filter(e => e.category === selCat);
    if (selMon !== 'Todos os Meses') list = list.filter(e => mk(e.date) === selMon);
    // Exclude hero from grid
    if (hero) list = list.filter(e => e.id !== hero.id);
    list.sort((a, b) => b.date.localeCompare(a.date));
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
          <button className="tsl-back-btn" onClick={() => setDetail(null)}>← Voltar</button>
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
            <a className={`tsl-nav-link ${page === 'home' && !detail ? 'active' : ''}`} onClick={() => { setPage('home'); setDetail(null); }}>Início</a>
            <a className={`tsl-nav-link ${page === 'agenda' && !detail ? 'active' : ''}`} onClick={() => { setPage('agenda'); setDetail(null); }}>Agenda</a>
          </nav>
        </div>
      </header>

      

      {page === "home" && !detail && <>
      {/* EM DESTAQUE */}
      {(() => {
        const highlights = events.filter(e => ["antonio-zambujo-concerto-2026-03-21", "viagem-a-lisboa-um-espetaculo-d-o-clube-2026-03-14"].includes(e.id));
        if (highlights.length === 0) return null;
        return <HighlightsSection highlights={highlights} onSelect={setDetail} />;
      })()}
      {/* NO CINEMA */}
      {cinema.length > 0 && (
        <section className="tsl-cinema">
          <div className="tsl-cinema-header">
            <h2 className="tsl-cinema-title">No Cinema</h2>
            <a className="tsl-cinema-link" href="https://castellolopescinemas.pt/barra-shopping-barreiro/" target="_blank" rel="noopener noreferrer">
              Ver tudo →
            </a>
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

      </>}

      {page === "agenda" && !detail && <>
      <div className="tsl-agenda-heading"><h1 className="tsl-agenda-title">Agenda</h1></div>
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
          <div className="tsl-view-toggle">
            <button className={`tsl-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
            <button className={`tsl-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={18} /></button>
          </div>
        </div>
      </div>

      {/* EVENTS — grouped by month */}
      <main className="tsl-main">
        {grouped.length === 0 && (
          <div className="tsl-empty"><p>Sem eventos encontrados</p></div>
        )}

        {grouped.map(([mkey, evts]) => (
          <section key={mkey} className="tsl-month">
            <h2 className="tsl-month-title">{mkLabel(mkey)}</h2>
            <div className={viewMode === 'grid' ? "tsl-grid" : "tsl-list"}>
              {evts.map(ev => viewMode === 'grid' ? (
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
                    {ev.location && ev.location !== "Barreiro" && cleanLoc(ev.location) && (
                      <span className="tsl-card-loc">{cleanLoc(ev.location)}</span>
                    )}
                    <span className="tsl-card-more">Ver Mais →</span>
                  </div>
                </a>
              ) : (
                <a key={ev.id} className="tsl-list-item" onClick={() => setDetail(ev)}>
                  {ev.imageUrl && <img className="tsl-list-img" src={ev.imageUrl} alt={ev.title} loading="lazy" />}
                  <span className="tsl-list-date">{fmtRange(ev.date, ev.endDate)}</span>
                  <span className="tsl-list-title">{ev.title}</span>
                  <span className="tsl-list-cat">{ev.category.toLowerCase()}</span>
                  {ev.location && cleanLoc(ev.location) && <span className="tsl-list-loc">{cleanLoc(ev.location)}</span>}
                  <span className="tsl-list-arrow">→</span>
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

      </>}

      {/* EDIÇÕES PDF */}
      <section className="tsl-pdf">
        <h2 className="tsl-pdf-heading">edição em pdf</h2>
        <div className="tsl-pdf-grid">
          {[
            { title: 'março / abril 2026', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2026/02/Agenda-de-Eventos-Barreiro-marco-abril-2026_galeria_agenda2830.jpg', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2026/02/agenda2830-Barreiro_mar_abr_2026.pdf' },
            { title: 'janeiro / fevereiro 2026', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/1920x1150px_galeria_agenda2830-1.jpg', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/agenda2830_jan_fev_2026.pdf' },
            { title: 'especial natal 2025', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/1920x1150px_galeria_agenda2830.jpg', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/12/Agenda-2830_Natal_25-1.pdf' },
            { title: 'novembro / dezembro 2025', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/10/1920x1150px_galeria_agenda2830-3.jpg', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/10/agenda2830_nov_dez_2025.pdf' },
            { title: 'setembro / outubro 2025', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/08/1920x1150px_galeria_agenda2830.jpg', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/08/agenda2830_set-out-2025.pdf' },
            { title: 'julho / agosto 2025', img: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/06/1920x1150px_galeria_agenda2830-1.jpg', pdf: 'https://www.cm-barreiro.pt/wp-content/uploads/2025/06/agenda2830_julho_agosto_2025_editavelFINAL.pdf' },
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