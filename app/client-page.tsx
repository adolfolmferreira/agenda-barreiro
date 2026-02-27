'use client';

import { useState, useMemo } from 'react';
import type { NormalizedEvent, EventCategory } from '@/lib/scrapers/types';

// Cores por categoria (inspirado São Luiz)
const CAT_COLORS: Record<EventCategory, string> = {
  'música': '#E63946',
  'teatro': '#457B9D',
  'dança': '#2A9D8F',
  'cinema': '#264653',
  'exposição': '#E9C46A',
  'workshop': '#F4A261',
  'literatura': '#6D6875',
  'infantil': '#FF6B9D',
  'festival': '#9B5DE5',
  'desporto': '#00BBF9',
  'visita': '#00F5D4',
  'outro': '#999999',
};

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDate();
  const month = MONTHS_PT[d.getMonth()];
  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return `${weekdays[d.getDay()]}, ${day} ${month}`;
}

function getMonthYear(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`;
}

interface Props {
  initialEvents: NormalizedEvent[];
}

type TimeFilter = 'agenda' | 'hoje' | 'semana' | 'fds';

export default function ClientPage({ initialEvents }: Props) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('agenda');
  const [catFilter, setCatFilter] = useState<EventCategory | ''>('');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let evts = initialEvents;

    // Filtro temporal
    if (timeFilter === 'hoje') {
      evts = evts.filter(e => e.date === today || (e.endDate && e.date <= today && e.endDate >= today));
    } else if (timeFilter === 'semana') {
      const end = new Date();
      end.setDate(end.getDate() + 7);
      const endStr = end.toISOString().split('T')[0];
      evts = evts.filter(e => e.date >= today && e.date <= endStr);
    } else if (timeFilter === 'fds') {
      const now = new Date();
      const dow = now.getDay();
      const daysToSat = (6 - dow + 7) % 7 || 7;
      const sat = new Date(now);
      sat.setDate(now.getDate() + (dow === 6 ? 0 : daysToSat));
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      const satStr = sat.toISOString().split('T')[0];
      const sunStr = sun.toISOString().split('T')[0];
      evts = evts.filter(e => e.date === satStr || e.date === sunStr);
    }

    // Filtro por categoria
    if (catFilter) {
      evts = evts.filter(e => e.category === catFilter);
    }

    // Pesquisa
    if (search) {
      const q = search.toLowerCase();
      evts = evts.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }

    return evts;
  }, [initialEvents, timeFilter, catFilter, search, today]);

  // Agrupar por mês
  const grouped = useMemo(() => {
    const map = new Map<string, NormalizedEvent[]>();
    for (const e of filtered) {
      const key = getMonthYear(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [filtered]);

  const featured = initialEvents.filter(e => e.featured);
  const categories = [...new Set(initialEvents.map(e => e.category))].sort();

  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}
        onBack={() => setSelectedEvent(null)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Header */}
      <header style={{ marginBottom: 48, borderBottom: '1px solid #e0e0e0', paddingBottom: 24 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', 'Georgia', serif", fontSize: 42, fontWeight: 400, margin: 0, letterSpacing: '-0.02em' }}>
          Agenda Barreiro
        </h1>
        <p style={{ color: '#888', fontSize: 14, margin: '8px 0 0', fontStyle: 'italic' }}>
          O que se passa na cidade — eventos e cultura
        </p>
      </header>

      {/* Filtros */}
      <nav style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {([
            ['agenda', 'Agenda'],
            ['hoje', 'Hoje'],
            ['semana', 'Esta semana'],
            ['fds', 'Fim-de-semana'],
          ] as [TimeFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTimeFilter(key)}
              style={{
                background: 'none', border: '1px solid #ddd', padding: '8px 16px',
                cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                borderRight: 'none',
                backgroundColor: timeFilter === key ? '#111' : 'transparent',
                color: timeFilter === key ? '#fff' : '#555',
              }}
            >
              {label}
            </button>
          ))}
          <div style={{ border: '1px solid #ddd', borderLeft: 'none' }} />
        </div>

        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value as EventCategory | '')}
          style={{
            background: 'none', border: '1px solid #ddd', padding: '8px 12px',
            fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', color: '#555',
          }}
        >
          <option value="">Todas as categorias</option>
          {categories.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          style={{
            border: '1px solid #ddd', padding: '8px 12px', fontSize: 13,
            fontFamily: 'inherit', marginLeft: 'auto', width: 180,
          }}
        />
      </nav>

      {/* Em Destaque */}
      {featured.length > 0 && timeFilter === 'agenda' && !catFilter && !search && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, fontStyle: 'italic', color: '#aaa', marginBottom: 20 }}>
            Em destaque
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {featured.slice(0, 3).map(e => (
              <EventCard key={e.id} event={e} onClick={() => setSelectedEvent(e)} />
            ))}
          </div>
        </section>
      )}

      {/* Estado vazio */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
          <p style={{ fontSize: 18, fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            {initialEvents.length === 0
              ? 'Ainda não há eventos. Corre o scraping para começar.'
              : 'Nenhum evento encontrado com estes filtros.'
            }
          </p>
          {initialEvents.length === 0 && (
            <p style={{ fontSize: 13, marginTop: 12 }}>
              <code style={{ background: '#f5f5f5', padding: '4px 8px' }}>npm run scrape</code> ou
              visita <code style={{ background: '#f5f5f5', padding: '4px 8px' }}>/api/scrape</code>
            </p>
          )}
        </div>
      )}

      {/* Listagem por mês */}
      {Array.from(grouped.entries()).map(([month, events]) => (
        <section key={month} style={{ marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400,
            fontStyle: 'italic', color: '#bbb', marginBottom: 20,
            borderBottom: '1px solid #eee', paddingBottom: 8,
          }}>
            {month}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {events.map(e => (
              <EventCard key={e.id} event={e} onClick={() => setSelectedEvent(e)} />
            ))}
          </div>
        </section>
      ))}

      {/* Fontes */}
      <footer style={{ borderTop: '1px solid #eee', paddingTop: 24, marginTop: 48, color: '#aaa', fontSize: 12 }}>
        <p>
          Fontes: CM Barreiro · Agenda 2830 Júnior · OUT.RA — Associação Cultural
        </p>
        <p>Dados actualizados automaticamente de 6 em 6 horas.</p>
      </footer>
    </div>
  );
}

// === Event Card ===
function EventCard({ event: e, onClick }: { event: NormalizedEvent; onClick: () => void }) {
  const color = CAT_COLORS[e.category] || CAT_COLORS.outro;

  return (
    <article
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
      onMouseEnter={ev => (ev.currentTarget.style.opacity = '0.8')}
      onMouseLeave={ev => (ev.currentTarget.style.opacity = '1')}
    >
      {e.imageUrl && (
        <div style={{ aspectRatio: '16/10', overflow: 'hidden', marginBottom: 12, background: '#f5f5f5' }}>
          <img
            src={e.imageUrl}
            alt={e.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      )}

      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
        {formatDate(e.date)}
        {e.time && ` · ${e.time}`}
      </div>

      <span style={{
        display: 'inline-block', fontSize: 10, fontWeight: 600,
        color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
      }}>
        {e.category}
      </span>

      <h3 style={{
        fontFamily: "'Instrument Serif', 'Georgia', serif",
        fontSize: 20, fontWeight: 400, margin: '0 0 6px', lineHeight: 1.25,
      }}>
        {e.title}
      </h3>

      {e.description && (
        <p style={{ fontSize: 13, color: '#777', margin: '0 0 6px', lineHeight: 1.5 }}>
          {e.description.slice(0, 120)}{e.description.length > 120 ? '…' : ''}
        </p>
      )}

      <div style={{ fontSize: 12, color: '#aaa' }}>
        {e.location}
        <span style={{ marginLeft: 8, opacity: 0.5 }}>via {e.source}</span>
      </div>
    </article>
  );
}

// === Event Detail ===
function EventDetail({ event: e, onBack }: { event: NormalizedEvent; onBack: () => void }) {
  const color = CAT_COLORS[e.category] || CAT_COLORS.outro;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', fontFamily: "'Inter', sans-serif" }}>
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#999', padding: 0, marginBottom: 32,
          fontFamily: 'inherit',
        }}
      >
        ← Voltar à agenda
      </button>

      <span style={{
        display: 'inline-block', fontSize: 11, fontWeight: 600,
        color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
      }}>
        {e.category}
      </span>

      <h1 style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: 38, fontWeight: 400, margin: '0 0 16px', lineHeight: 1.15,
      }}>
        {e.title}
      </h1>

      <div style={{ fontSize: 14, color: '#777', marginBottom: 24, lineHeight: 1.8 }}>
        <div>{formatDate(e.date)}{e.time && ` · ${e.time}`}</div>
        {e.endDate && e.endDate !== e.date && <div>até {formatDate(e.endDate)}</div>}
        <div>{e.location}</div>
      </div>

      {e.imageUrl && (
        <img src={e.imageUrl} alt={e.title} style={{ width: '100%', marginBottom: 24 }} />
      )}

      {e.description && (
        <p style={{ fontSize: 15, lineHeight: 1.8, color: '#444', marginBottom: 24 }}>
          {e.description}
        </p>
      )}

      {e.tags.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {e.tags.map(t => (
            <span key={t} style={{
              display: 'inline-block', fontSize: 11, background: '#f0f0f0',
              padding: '3px 8px', marginRight: 6, marginBottom: 4,
            }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {e.sourceUrl && (
        <a
          href={e.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: '#999', textDecoration: 'underline' }}
        >
          Ver na fonte original →
        </a>
      )}

      <div style={{ fontSize: 11, color: '#ccc', marginTop: 32, borderTop: '1px solid #eee', paddingTop: 12 }}>
        Fonte: {e.source} · Recolhido em {new Date(e.scrapedAt).toLocaleDateString('pt-PT')}
      </div>
    </div>
  );
}