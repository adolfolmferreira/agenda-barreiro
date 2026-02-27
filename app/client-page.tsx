'use client';

import { useState, useMemo } from 'react';

// ─── Fonts ──────────────────────────────────────────────────────
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800;900&display=swap';

// ─── Types ──────────────────────────────────────────────────────
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

// ─── Category colors ────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Música': '#E63946',
  'Exposição': '#457B9D',
  'Dança': '#2A9D8F',
  'Teatro': '#6D28D9',
  'Desporto': '#EA580C',
  'Workshop': '#D97706',
  'Cinema': '#1D4ED8',
  'Leitura': '#059669',
  'Visitas': '#7C3AED',
  'Comunidade': '#374151',
};

function catColor(cat: string): string {
  return CAT_COLORS[cat] || '#374151';
}

// ─── Date formatting ────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtDay(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.getDate();
}
function fmtMonth(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return MESES[dt.getMonth()]?.slice(0, 3).toUpperCase();
}
function fmtMonthFull(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return MESES[dt.getMonth()];
}
function fmtYear(d: string) { return d.slice(0, 4); }
function monthYearKey(d: string) { return d.slice(0, 7); }
function monthYearLabel(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return `${MESES[dt.getMonth()]} ${dt.getFullYear()}`;
}
function fmtDateRange(d: string, end?: string) {
  const s = `${fmtDay(d)} ${fmtMonthFull(d)} ${fmtYear(d)}`;
  if (!end) return s;
  return `${fmtDay(d)} ${fmtMonthFull(d)} — ${fmtDay(end)} ${fmtMonthFull(end)} ${fmtYear(end)}`;
}

// ─── Component ──────────────────────────────────────────────────
export default function ClientPage({ events: serverEvents, updatedAt }: Props) {
  const allEvents = useMemo(() => {
    const ev = serverEvents && serverEvents.length > 0 ? serverEvents : [];
    return ev.sort((a, b) => a.date.localeCompare(b.date));
  }, [serverEvents]);

  const categories = useMemo(() => {
    const s = new Set(allEvents.map(e => e.category));
    return ['Todos', ...Array.from(s).sort()];
  }, [allEvents]);

  const months = useMemo(() => {
    const s = new Set(allEvents.map(e => monthYearKey(e.date)));
    return Array.from(s).sort();
  }, [allEvents]);

  const [cat, setCat] = useState('Todos');
  const [month, setMonth] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Event | null>(null);

  const filtered = useMemo(() => {
    return allEvents.filter(e => {
      if (cat !== 'Todos' && e.category !== cat) return false;
      if (month && !e.date.startsWith(month)) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!e.title.toLowerCase().includes(s) && !e.location.toLowerCase().includes(s) && !e.description.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [allEvents, cat, month, q]);

  const grouped = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of filtered) {
      const k = monthYearKey(e.date);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [filtered]);

  const featured = allEvents.find(e => e.featured) || allEvents[0];

  // ─── Detail view ────────────────────────────────────────────
  if (selected) {
    const e = selected;
    const c = catColor(e.category);
    return (
      <>
        <link href={FONT_LINK} rel="stylesheet" />
        <style>{`* { margin:0; padding:0; box-sizing:border-box; } body { font-family:'Inter',sans-serif; background:#FAFAFA; color:#1a1a1a; }`}</style>
        <div style={{ minHeight:'100vh' }}>
          {/* Hero */}
          <div style={{ position:'relative', height: e.imageUrl ? 400 : 200, background: e.imageUrl ? `url(${e.imageUrl}) center/cover` : c, display:'flex', alignItems:'flex-end' }}>
            {e.imageUrl && <div style={{ position:'absolute', inset:0, background:'linear-gradient(transparent 40%, rgba(0,0,0,0.7))' }} />}
            <div style={{ position:'relative', zIndex:1, padding:'40px', maxWidth:900 }}>
              <span style={{ display:'inline-block', background:c, color:'#fff', padding:'4px 12px', fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>{e.category}</span>
              <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:48, fontStyle:'italic', color:'#fff', lineHeight:1.1 }}>{e.title}</h1>
            </div>
          </div>

          {/* Back */}
          <div style={{ maxWidth:900, margin:'0 auto', padding:'30px 24px' }}>
            <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Inter', fontSize:14, fontWeight:600, color:c, marginBottom:30 }}>
              ← Voltar à agenda
            </button>

            {/* Info grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:40 }}>
              <div style={{ padding:20, background:'#fff', borderRadius:8, borderLeft:`4px solid ${c}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:1 }}>Data</div>
                <div style={{ fontSize:16, fontWeight:600, marginTop:4 }}>{fmtDateRange(e.date, e.endDate)}</div>
                {e.time && <div style={{ fontSize:14, color:'#666', marginTop:2 }}>{e.time}h</div>}
              </div>
              <div style={{ padding:20, background:'#fff', borderRadius:8, borderLeft:`4px solid ${c}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:1 }}>Local</div>
                <div style={{ fontSize:16, fontWeight:600, marginTop:4 }}>{e.location}</div>
              </div>
              {e.price && (
                <div style={{ padding:20, background:'#fff', borderRadius:8, borderLeft:`4px solid ${c}` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:1 }}>Preço</div>
                  <div style={{ fontSize:16, fontWeight:600, marginTop:4 }}>{e.price}</div>
                </div>
              )}
              {e.organizer && (
                <div style={{ padding:20, background:'#fff', borderRadius:8, borderLeft:`4px solid ${c}` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:1 }}>Organização</div>
                  <div style={{ fontSize:16, fontWeight:600, marginTop:4 }}>{e.organizer}</div>
                </div>
              )}
              {e.contacts && (
                <div style={{ padding:20, background:'#fff', borderRadius:8, borderLeft:`4px solid ${c}` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:1 }}>Contactos</div>
                  <div style={{ fontSize:14, fontWeight:500, marginTop:4 }}>{e.contacts}</div>
                </div>
              )}
              {e.ageRating && (
                <div style={{ padding:20, background:'#fff', borderRadius:8, borderLeft:`4px solid ${c}` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:1 }}>Classificação</div>
                  <div style={{ fontSize:16, fontWeight:600, marginTop:4 }}>{e.ageRating}</div>
                </div>
              )}
            </div>

            {/* Description */}
            {e.descriptionFull && (
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:28, fontStyle:'italic', marginBottom:16 }}>Sobre</h2>
                <div style={{ fontSize:16, lineHeight:1.8, color:'#333', whiteSpace:'pre-line' }}>{e.descriptionFull}</div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {e.ticketUrl && (
                <a href={e.ticketUrl} target="_blank" rel="noopener" style={{ display:'inline-block', background:c, color:'#fff', padding:'12px 28px', borderRadius:6, fontWeight:700, fontSize:14, textDecoration:'none' }}>
                  Comprar Bilhete →
                </a>
              )}
              <a href={e.sourceUrl} target="_blank" rel="noopener" style={{ display:'inline-block', background:'#1a1a1a', color:'#fff', padding:'12px 28px', borderRadius:6, fontWeight:700, fontSize:14, textDecoration:'none' }}>
                Ver no site da CM Barreiro →
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── List view ──────────────────────────────────────────────
  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`* { margin:0; padding:0; box-sizing:border-box; } body { font-family:'Inter',sans-serif; background:#FAFAFA; color:#1a1a1a; } ::selection { background:#E63946; color:#fff; }`}</style>
      <div style={{ minHeight:'100vh' }}>

        {/* ─── Header ─── */}
        <header style={{ background:'#1a1a1a', padding:'24px 40px' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <div>
              <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:36, fontStyle:'italic', color:'#fff', lineHeight:1 }}>Agenda Barreiro</h1>
              <p style={{ fontSize:13, color:'#888', marginTop:4, fontWeight:500 }}>Eventos & Cultura</p>
            </div>
            {updatedAt && (
              <p style={{ fontSize:11, color:'#666' }}>Actualizado {new Date(updatedAt).toLocaleDateString('pt-PT')}</p>
            )}
          </div>
        </header>

        {/* ─── Hero (featured event) ─── */}
        {featured && (
          <div
            onClick={() => setSelected(featured)}
            style={{
              position:'relative', cursor:'pointer', overflow:'hidden',
              height: featured.imageUrl ? 420 : 280,
              background: featured.imageUrl ? `url(${featured.imageUrl}) center/cover` : catColor(featured.category),
              transition:'all 0.3s',
            }}
          >
            {featured.imageUrl && <div style={{ position:'absolute', inset:0, background:'linear-gradient(transparent 30%, rgba(0,0,0,0.75))' }} />}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'48px 40px', zIndex:1, maxWidth:1200, margin:'0 auto' }}>
              <span style={{ display:'inline-block', background:catColor(featured.category), color:'#fff', padding:'4px 14px', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>{featured.category}</span>
              <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:56, fontStyle:'italic', color:'#fff', lineHeight:1.05, maxWidth:700 }}>{featured.title}</h2>
              <p style={{ fontSize:15, color:'rgba(255,255,255,0.8)', marginTop:10, fontWeight:500 }}>
                {fmtDateRange(featured.date, featured.endDate)} · {featured.location}
              </p>
            </div>
          </div>
        )}

        {/* ─── Filters ─── */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e5e5e5', padding:'16px 40px', position:'sticky', top:0, zIndex:100 }}>
          <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            {/* Categories */}
            {categories.map(c2 => (
              <button
                key={c2}
                onClick={() => setCat(c2)}
                style={{
                  padding:'6px 16px', borderRadius:20, border:'1px solid',
                  borderColor: cat === c2 ? '#1a1a1a' : '#ddd',
                  background: cat === c2 ? '#1a1a1a' : 'transparent',
                  color: cat === c2 ? '#fff' : '#666',
                  fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter',
                  transition:'all 0.2s',
                }}
              >{c2}</button>
            ))}
            <div style={{ flex:1 }} />
            {/* Month filter */}
            <select
              value={month}
              onChange={e2 => setMonth(e2.target.value)}
              style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #ddd', fontSize:13, fontFamily:'Inter', fontWeight:500, cursor:'pointer', background:'#fff' }}
            >
              <option value="">Todos os meses</option>
              {months.map(m => <option key={m} value={m}>{monthYearLabel(m.padEnd(10,'0'.repeat(3)))}</option>)}
            </select>
            {/* Search */}
            <input
              type="text"
              placeholder="Pesquisar..."
              value={q}
              onChange={e2 => setQ(e2.target.value)}
              style={{ padding:'6px 14px', borderRadius:6, border:'1px solid #ddd', fontSize:13, fontFamily:'Inter', width:180 }}
            />
          </div>
        </div>

        {/* ─── No results ─── */}
        {filtered.length === 0 && allEvents.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 24px' }}>
            <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:32, fontStyle:'italic', marginBottom:12 }}>Sem eventos</h2>
            <p style={{ fontSize:15, color:'#888' }}>Corre <code style={{ background:'#f0f0f0', padding:'2px 6px', borderRadius:4 }}>npm run scrape</code> para carregar eventos da CM Barreiro.</p>
          </div>
        )}

        {filtered.length === 0 && allEvents.length > 0 && (
          <div style={{ textAlign:'center', padding:'80px 24px' }}>
            <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:28, fontStyle:'italic', marginBottom:8 }}>Nenhum resultado</h2>
            <p style={{ fontSize:14, color:'#888' }}>Tenta outros filtros.</p>
          </div>
        )}

        {/* ─── Events grouped by month ─── */}
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 40px' }}>
          {Array.from(grouped.entries()).map(([mk, evts]) => (
            <div key={mk} style={{ marginBottom:48 }}>
              <h3 style={{ fontFamily:"'Instrument Serif',serif", fontSize:32, fontStyle:'italic', borderBottom:'2px solid #1a1a1a', paddingBottom:8, marginBottom:24 }}>
                {monthYearLabel(mk + '-01')}
              </h3>
              <div style={{ display:'grid', gap:20 }}>
                {evts.map(e => {
                  const c2 = catColor(e.category);
                  return (
                    <div
                      key={e.id}
                      onClick={() => setSelected(e)}
                      style={{
                        display:'grid', gridTemplateColumns: e.imageUrl ? '240px 1fr' : '6px 1fr',
                        background:'#fff', borderRadius:8, overflow:'hidden', cursor:'pointer',
                        transition:'transform 0.2s, box-shadow 0.2s',
                        boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
                      }}
                      onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (ev.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.transform = ''; (ev.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
                    >
                      {/* Image or color bar */}
                      {e.imageUrl ? (
                        <div style={{ background:`url(${e.imageUrl}) center/cover`, minHeight:160 }} />
                      ) : (
                        <div style={{ background:c2 }} />
                      )}
                      {/* Content */}
                      <div style={{ padding:24 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                          <span style={{ background:c2, color:'#fff', padding:'3px 10px', fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', borderRadius:3 }}>{e.category}</span>
                          {e.price && <span style={{ fontSize:12, fontWeight:600, color:e.price === 'Gratuito' ? '#059669' : '#666' }}>{e.price}</span>}
                        </div>
                        <h4 style={{ fontFamily:"'Instrument Serif',serif", fontSize:24, fontStyle:'italic', lineHeight:1.2, marginBottom:6 }}>{e.title}</h4>
                        <div style={{ fontSize:13, color:'#888', fontWeight:500 }}>
                          <span>{fmtDay(e.date)} {fmtMonth(e.date)} {fmtYear(e.date)}</span>
                          {e.endDate && <span> — {fmtDay(e.endDate)} {fmtMonth(e.endDate)}</span>}
                          {e.time && <span> · {e.time}h</span>}
                          <span> · {e.location}</span>
                        </div>
                        {e.description && (
                          <p style={{ fontSize:14, color:'#555', lineHeight:1.6, marginTop:8, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                            {e.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Footer ─── */}
        <footer style={{ background:'#1a1a1a', color:'#888', padding:'30px 40px', textAlign:'center', fontSize:13 }}>
          <p>Agenda Barreiro · Dados: <a href="https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" target="_blank" style={{ color:'#aaa' }}>CM Barreiro</a></p>
          {updatedAt && <p style={{ marginTop:4, fontSize:11 }}>Última actualização: {new Date(updatedAt).toLocaleString('pt-PT')}</p>}
        </footer>
      </div>
    </>
  );
}