'use client';

import { useState, useMemo } from 'react';
import type { Event } from '@/lib/scraper';

const CAT_COLORS: Record<string, string> = {
  'Música': '#E63946', 'Teatro': '#457B9D', 'Dança': '#2A9D8F',
  'Cinema': '#264653', 'Exposição': '#E9C46A', 'Workshop': '#F4A261',
  'Literatura': '#6D6875', 'Infantil': '#FF6B9D', 'Festival': '#9B5DE5',
  'Desporto': '#00BBF9', 'Visita': '#00F5D4', 'Ambiente': '#52B788',
  'Cultura': '#999',
};

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function monthYear(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

type TF = 'agenda' | 'hoje' | 'semana' | 'fds';

export default function ClientPage({ initialEvents }: { initialEvents: Event[] }) {
  const [tf, setTf] = useState<TF>('agenda');
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Event | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let evts = initialEvents;
    if (tf === 'hoje') evts = evts.filter(e => e.date === today || (e.endDate && e.date <= today && e.endDate >= today));
    else if (tf === 'semana') {
      const end = new Date(); end.setDate(end.getDate() + 7);
      const es = end.toISOString().split('T')[0];
      evts = evts.filter(e => e.date >= today && e.date <= es);
    } else if (tf === 'fds') {
      const now = new Date(), dow = now.getDay();
      const sat = new Date(now); sat.setDate(now.getDate() + ((6 - dow + 7) % 7 || 7));
      if (dow === 6) sat.setDate(now.getDate());
      const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
      const ss = sat.toISOString().split('T')[0], su = sun.toISOString().split('T')[0];
      evts = evts.filter(e => e.date === ss || e.date === su);
    }
    if (cat) evts = evts.filter(e => e.category === cat);
    if (q) { const s = q.toLowerCase(); evts = evts.filter(e => e.title.toLowerCase().includes(s) || e.description.toLowerCase().includes(s) || e.location.toLowerCase().includes(s)); }
    return evts;
  }, [initialEvents, tf, cat, q, today]);

  const grouped = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of filtered) { const k = monthYear(e.date); if (!m.has(k)) m.set(k, []); m.get(k)!.push(e); }
    return m;
  }, [filtered]);

  const cats = [...new Set(initialEvents.map(e => e.category))].sort();

  if (sel) return <Detail e={sel} onBack={() => setSel(null)} />;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <header style={{ marginBottom: 48, borderBottom: '1px solid #e0e0e0', paddingBottom: 24 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 42, fontWeight: 400, margin: 0, letterSpacing: '-0.02em' }}>Agenda Barreiro</h1>
        <p style={{ color: '#888', fontSize: 14, margin: '8px 0 0', fontStyle: 'italic' }}>O que se passa na cidade — eventos e cultura</p>
      </header>

      <nav style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
        <div style={{ display: 'flex' }}>
          {([['agenda','Agenda'],['hoje','Hoje'],['semana','Esta semana'],['fds','Fim-de-semana']] as [TF,string][]).map(([k,l]) => (
            <button key={k} onClick={() => setTf(k)} style={{ background: tf===k?'#111':'none', color: tf===k?'#fff':'#555', border: '1px solid #ddd', borderRight: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>{l}</button>
          ))}
          <div style={{ borderRight: '1px solid #ddd' }} />
        </div>
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ border: '1px solid #ddd', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', background: 'none', cursor: 'pointer', color: '#555' }}>
          <option value="">Todas as categorias</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar..." style={{ border: '1px solid #ddd', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', marginLeft: 'auto', width: 180 }} />
      </nav>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
          <p style={{ fontSize: 18, fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            {initialEvents.length === 0 ? 'Ainda não há eventos. Corre o scraping para começar.' : 'Nenhum evento encontrado.'}
          </p>
          {initialEvents.length === 0 && <p style={{ fontSize: 13, marginTop: 12 }}><code style={{ background: '#f5f5f5', padding: '4px 8px' }}>npm run scrape</code> ou visita <code style={{ background: '#f5f5f5', padding: '4px 8px' }}>/api/scrape</code></p>}
        </div>
      )}

      {Array.from(grouped.entries()).map(([month, events]) => (
        <section key={month} style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, fontStyle: 'italic', color: '#bbb', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 8 }}>{month}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {events.map(e => <Card key={e.id} e={e} onClick={() => setSel(e)} />)}
          </div>
        </section>
      ))}

      <footer style={{ borderTop: '1px solid #eee', paddingTop: 24, marginTop: 48, color: '#aaa', fontSize: 12 }}>
        <p>Fonte: <a href="https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" target="_blank" rel="noopener" style={{ color: '#aaa' }}>Câmara Municipal do Barreiro</a></p>
        <p>Actualizado automaticamente de 6 em 6 horas.</p>
      </footer>
    </div>
  );
}

function Card({ e, onClick }: { e: Event; onClick: () => void }) {
  const color = CAT_COLORS[e.category] || '#999';
  return (
    <article onClick={onClick} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={ev => ev.currentTarget.style.opacity = '0.75'} onMouseLeave={ev => ev.currentTarget.style.opacity = '1'}>
      {e.imageUrl && <div style={{ aspectRatio: '16/10', overflow: 'hidden', marginBottom: 12, background: '#f5f5f5' }}><img src={e.imageUrl} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /></div>}
      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{fmtDate(e.date)}{e.time && ` · ${e.time}`}</div>
      <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{e.category}</span>
      <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, fontWeight: 400, margin: '0 0 6px', lineHeight: 1.25 }}>{e.title}</h3>
      {e.description && <p style={{ fontSize: 13, color: '#777', margin: '0 0 6px', lineHeight: 1.5 }}>{e.description.slice(0, 120)}{e.description.length > 120 ? '…' : ''}</p>}
      <div style={{ fontSize: 12, color: '#aaa' }}>{e.location}</div>
    </article>
  );
}

function Detail({ e, onBack }: { e: Event; onBack: () => void }) {
  const color = CAT_COLORS[e.category] || '#999';
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', fontFamily: "'Inter', sans-serif" }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#999', padding: 0, marginBottom: 32, fontFamily: 'inherit' }}>← Voltar à agenda</button>
      <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{e.category}</span>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, margin: '0 0 16px', lineHeight: 1.15 }}>{e.title}</h1>
      <div style={{ fontSize: 14, color: '#777', marginBottom: 24, lineHeight: 1.8 }}>
        <div>{fmtDate(e.date)}{e.time && ` · ${e.time}`}</div>
        {e.endDate && e.endDate !== e.date && <div>até {fmtDate(e.endDate)}</div>}
        <div>{e.location}</div>
      </div>
      {e.imageUrl && <img src={e.imageUrl} alt={e.title} style={{ width: '100%', marginBottom: 24 }} />}
      {e.description && <p style={{ fontSize: 15, lineHeight: 1.8, color: '#444', marginBottom: 24 }}>{e.description}</p>}
      {e.tags.length > 0 && <div style={{ marginBottom: 24 }}>{e.tags.map(t => <span key={t} style={{ display: 'inline-block', fontSize: 11, background: '#f0f0f0', padding: '3px 8px', marginRight: 6, marginBottom: 4 }}>{t}</span>)}</div>}
      {e.sourceUrl && <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#999', textDecoration: 'underline' }}>Ver no site da CM Barreiro →</a>}
    </div>
  );
}