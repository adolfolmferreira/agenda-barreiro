'use client';

import { useState, useMemo } from 'react';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800;900&display=swap';

interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  endDate?: string;
  time?: string;
  location: string;
  price: string;
  description: string;
  descriptionFull: string;
  sourceUrl: string;
  imageUrl?: string;
  organizer?: string;
  contacts?: string;
  ticketUrl?: string;
  ageRating?: string;
  source: string;
  featured?: boolean;
}

interface Props {
  events?: Event[];
  updatedAt?: string | null;
}

const CAT_COLORS: Record<string, string> = {
  'Música': '#E63946', 'Exposição': '#457B9D', 'Dança': '#2A9D8F',
  'Teatro': '#6D28D9', 'Desporto': '#EA580C', 'Workshop': '#D97706',
  'Cinema': '#1D4ED8', 'Leitura': '#059669', 'Visitas': '#7C3AED',
  'Comunidade': '#374151',
};
function cc(cat: string) { return CAT_COLORS[cat] || '#374151'; }

const MS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function d2(d: string) { return new Date(d + 'T00:00:00'); }
function fDay(d: string) { return d2(d).getDate(); }
function fMon(d: string) { return MS[d2(d).getMonth()]?.slice(0, 3).toUpperCase() || ''; }
function fMonFull(d: string) { return MS[d2(d).getMonth()] || ''; }
function fYr(d: string) { return d.slice(0, 4); }
function mkKey(d: string) { return d.slice(0, 7); }
function mkLabel(key: string) {
  const [y, m] = key.split('-');
  const mi = parseInt(m, 10) - 1;
  if (isNaN(mi) || mi < 0 || mi > 11) return key;
  return `${MS[mi]} ${y}`;
}
function fRange(d: string, end?: string) {
  const s = `${fDay(d)} ${fMonFull(d)} ${fYr(d)}`;
  if (!end) return s;
  return `${fDay(d)} ${fMonFull(d)} — ${fDay(end)} ${fMonFull(end)} ${fYr(end)}`;
}

export default function ClientPage({ events: serverEvents, updatedAt }: Props) {
  const all = useMemo(() => {
    const ev = serverEvents && serverEvents.length > 0 ? serverEvents : [];
    return [...ev].sort((a, b) => a.date.localeCompare(b.date));
  }, [serverEvents]);

  const cats = useMemo(() => {
    const s = new Set(all.map(e => e.category));
    return ['Todos', ...Array.from(s).sort()];
  }, [all]);

  const mons = useMemo(() => {
    const s = new Set(all.map(e => mkKey(e.date)));
    return Array.from(s).sort();
  }, [all]);

  const [cat, setCat] = useState('Todos');
  const [mon, setMon] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Event | null>(null);

  const filtered = useMemo(() => all.filter(e => {
    if (cat !== 'Todos' && e.category !== cat) return false;
    if (mon && !e.date.startsWith(mon)) return false;
    if (q) {
      const s = q.toLowerCase();
      if (![e.title, e.location, e.description, e.category].some(f => f.toLowerCase().includes(s))) return false;
    }
    return true;
  }), [all, cat, mon, q]);

  const grouped = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of filtered) {
      const k = mkKey(e.date);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [filtered]);

  const hero = all.find(e => e.featured) || all[0];

  // ═══════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════
  if (sel) {
    const e = sel;
    const c = cc(e.category);
    return (
      <>
        <link href={FONT_LINK} rel="stylesheet" />
        <style>{`*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#FAFAFA;color:#1a1a1a}`}</style>
        <div style={{ minHeight: '100vh' }}>
          {/* Hero image */}
          <div style={{ position: 'relative', height: e.imageUrl ? 440 : 220, background: e.imageUrl ? `url(${e.imageUrl}) center/cover` : c }}>
            {e.imageUrl && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.75))' }} />}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px 40px', zIndex: 1, maxWidth: 960, margin: '0 auto' }}>
              <span style={{ display: 'inline-block', background: c, color: '#fff', padding: '4px 14px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>{e.category}</span>
              <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 52, fontStyle: 'italic', color: '#fff', lineHeight: 1.05 }}>{e.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 500, marginTop: 10 }}>
                {fRange(e.date, e.endDate)}{e.time ? ` · ${e.time}h` : ''} · {e.location}
              </p>
            </div>
          </div>

          <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
            <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: c, marginBottom: 32 }}>← Voltar à agenda</button>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 40 }}>
              {[
                { label: 'Data', val: fRange(e.date, e.endDate) + (e.time ? ` · ${e.time}h` : '') },
                { label: 'Local', val: e.location },
                e.price ? { label: 'Preço', val: e.price } : null,
                e.organizer ? { label: 'Organização', val: e.organizer } : null,
                e.contacts ? { label: 'Contactos', val: e.contacts } : null,
                e.ageRating ? { label: 'Classificação', val: e.ageRating } : null,
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} style={{ padding: 20, background: '#fff', borderRadius: 8, borderLeft: `4px solid ${c}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Full description */}
            {e.descriptionFull && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 28, fontStyle: 'italic', marginBottom: 16 }}>Sobre</h2>
                <div style={{ fontSize: 16, lineHeight: 1.85, color: '#333', whiteSpace: 'pre-line' }}>{e.descriptionFull}</div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {e.ticketUrl && <a href={e.ticketUrl} target="_blank" rel="noopener" style={{ display: 'inline-block', background: c, color: '#fff', padding: '14px 32px', borderRadius: 6, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Comprar Bilhete →</a>}
              <a href={e.sourceUrl} target="_blank" rel="noopener" style={{ display: 'inline-block', background: '#1a1a1a', color: '#fff', padding: '14px 32px', borderRadius: 6, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Ver no site da CM Barreiro →</a>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#FAFAFA;color:#1a1a1a}::selection{background:#E63946;color:#fff}`}</style>
      <div style={{ minHeight: '100vh' }}>

        {/* ─── Header ─── */}
        <header style={{ background: '#1a1a1a', padding: '20px 40px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 36, fontStyle: 'italic', color: '#fff', lineHeight: 1 }}>Agenda Barreiro</h1>
              <p style={{ fontSize: 12, color: '#777', marginTop: 4, fontWeight: 500, letterSpacing: 0.5 }}>Eventos & Cultura</p>
            </div>
            {updatedAt && <p style={{ fontSize: 11, color: '#555' }}>Actualizado {new Date(updatedAt).toLocaleDateString('pt-PT')}</p>}
          </div>
        </header>

        {/* ─── Hero banner ─── */}
        {hero && (
          <div onClick={() => setSel(hero)} style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', height: hero.imageUrl ? 440 : 300, background: hero.imageUrl ? `url(${hero.imageUrl}) center/cover` : cc(hero.category) }}>
            {hero.imageUrl && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 25%, rgba(0,0,0,0.8))' }} />}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '56px 40px 48px', zIndex: 1 }}>
              <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <span style={{ display: 'inline-block', background: cc(hero.category), color: '#fff', padding: '5px 16px', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>{hero.category}</span>
                <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 60, fontStyle: 'italic', color: '#fff', lineHeight: 1.02, maxWidth: 800 }}>{hero.title}</h2>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 12, fontWeight: 500 }}>
                  {fRange(hero.date, hero.endDate)} · {hero.location}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Filters ─── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '14px 40px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {cats.map(c2 => (
              <button key={c2} onClick={() => setCat(c2)} style={{
                padding: '6px 16px', borderRadius: 20, border: '1px solid',
                borderColor: cat === c2 ? '#1a1a1a' : '#ddd',
                background: cat === c2 ? '#1a1a1a' : 'transparent',
                color: cat === c2 ? '#fff' : '#666',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.2s',
              }}>{c2}</button>
            ))}
            <div style={{ flex: 1 }} />
            <select value={mon} onChange={e => setMon(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, fontFamily: 'Inter', fontWeight: 500, cursor: 'pointer', background: '#fff' }}>
              <option value="">Todos os meses</option>
              {mons.map(m => <option key={m} value={m}>{mkLabel(m)}</option>)}
            </select>
            <input type="text" placeholder="Pesquisar..." value={q} onChange={e => setQ(e.target.value)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, fontFamily: 'Inter', width: 180 }} />
          </div>
        </div>

        {/* ─── Empty states ─── */}
        {filtered.length === 0 && all.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 24px' }}>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 32, fontStyle: 'italic', marginBottom: 12 }}>Sem eventos</h2>
            <p style={{ fontSize: 15, color: '#888' }}>Corre <code style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>npm run scrape</code> para carregar eventos.</p>
          </div>
        )}
        {filtered.length === 0 && all.length > 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 28, fontStyle: 'italic', marginBottom: 8 }}>Nenhum resultado</h2>
            <p style={{ fontSize: 14, color: '#888' }}>Tenta outros filtros.</p>
          </div>
        )}

        {/* ─── Events grouped by month — 3-column card grid ─── */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 40px' }}>
          {Array.from(grouped.entries()).map(([mk, evts]) => (
            <div key={mk} style={{ marginBottom: 56 }}>
              <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 36, fontStyle: 'italic', borderBottom: '3px solid #1a1a1a', paddingBottom: 10, marginBottom: 28 }}>
                {mkLabel(mk)}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {evts.map(e => {
                  const c2 = cc(e.category);
                  return (
                    <div
                      key={e.id}
                      onClick={() => setSel(e)}
                      style={{
                        background: '#fff', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                        transition: 'transform 0.25s, box-shadow 0.25s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        display: 'flex', flexDirection: 'column',
                      }}
                      onMouseEnter={ev => { const el = ev.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
                      onMouseLeave={ev => { const el = ev.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
                    >
                      {/* Image / color block */}
                      <div style={{
                        height: 200, overflow: 'hidden', position: 'relative',
                        background: e.imageUrl ? `url(${e.imageUrl}) center/cover` : `linear-gradient(135deg, ${c2}, ${c2}dd)`,
                      }}>
                        {!e.imageUrl && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 64, fontStyle: 'italic', color: 'rgba(255,255,255,0.15)' }}>{e.title[0]}</span>
                          </div>
                        )}
                        {/* Category pill */}
                        <div style={{ position: 'absolute', top: 14, left: 14 }}>
                          <span style={{ background: c2, color: '#fff', padding: '4px 12px', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 3 }}>{e.category}</span>
                        </div>
                        {/* Price badge */}
                        {e.price && (
                          <div style={{ position: 'absolute', top: 14, right: 14 }}>
                            <span style={{ background: e.price === 'Gratuito' ? '#059669' : 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', fontSize: 10, fontWeight: 700, borderRadius: 3 }}>{e.price}</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ padding: '20px 22px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Date bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <div style={{ background: '#f5f5f5', borderRadius: 6, padding: '6px 10px', textAlign: 'center', minWidth: 48 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: '#1a1a1a' }}>{fDay(e.date)}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', letterSpacing: 0.5, marginTop: 2 }}>{fMon(e.date)}</div>
                          </div>
                          {e.endDate && (
                            <>
                              <span style={{ fontSize: 12, color: '#ccc' }}>→</span>
                              <div style={{ background: '#f5f5f5', borderRadius: 6, padding: '6px 10px', textAlign: 'center', minWidth: 48 }}>
                                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: '#1a1a1a' }}>{fDay(e.endDate)}</div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#999', letterSpacing: 0.5, marginTop: 2 }}>{fMon(e.endDate)}</div>
                              </div>
                            </>
                          )}
                          {e.time && <span style={{ fontSize: 12, color: '#999', fontWeight: 600, marginLeft: 'auto' }}>{e.time}h</span>}
                        </div>

                        <h4 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, fontStyle: 'italic', lineHeight: 1.2, marginBottom: 8, flex: 1 }}>{e.title}</h4>

                        <div style={{ fontSize: 12, color: '#888', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {e.location}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Footer ─── */}
        <footer style={{ background: '#1a1a1a', color: '#888', padding: '32px 40px', textAlign: 'center', fontSize: 13 }}>
          <p>Agenda Barreiro · Dados: <a href="https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" target="_blank" rel="noopener" style={{ color: '#aaa', textDecoration: 'underline' }}>CM Barreiro</a></p>
          {updatedAt && <p style={{ marginTop: 6, fontSize: 11, color: '#555' }}>Última actualização: {new Date(updatedAt).toLocaleString('pt-PT')}</p>}
        </footer>
      </div>
    </>
  );
}