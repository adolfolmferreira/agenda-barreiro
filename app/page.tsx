"use client";

import { useState, useMemo } from "react";
import { EVENTS, CATEGORIES, VENUES, type EventItem } from "@/lib/events";
import { formatShort, formatFull, monthKey, isToday, isThisWeek, isThisWeekend, inRange } from "@/lib/dates";

/* ─── Event Card ─── */
function Card({ ev, onClick }: { ev: EventItem; onClick: (e: EventItem) => void }) {
  const cat = CATEGORIES[ev.category];
  const ds = ev.endDate ? `${formatShort(ev.date)} – ${formatShort(ev.endDate)}` : formatShort(ev.date);

  return (
    <article
      onClick={() => onClick(ev)}
      className="card"
      style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
    >
      <div style={{ width: "100%", paddingBottom: "66%", position: "relative", overflow: "hidden", background: "#f2f0ed", marginBottom: 14 }}>
        <img src={ev.image} alt={ev.title} loading="lazy"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(15%)", transition: "transform .4s ease" }} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#999" }}>{ds}</span>
        <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "lowercase", letterSpacing: "0.03em", color: cat.color }}>{cat.label}</span>
      </div>
      <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 19, fontWeight: 400, lineHeight: 1.2, color: "#1a1a1a", marginBottom: 4 }}>{ev.title}</h3>
      {ev.subtitle && <p style={{ fontSize: 12.5, fontWeight: 300, color: "#888", lineHeight: 1.35 }}>{ev.subtitle}</p>}

      <style jsx>{`
        .card:hover img { transform: scale(1.03); }
        .card { transition: opacity .2s; }
        .card:hover { opacity: 0.8; }
      `}</style>
    </article>
  );
}

/* ─── Event Detail ─── */
function Detail({ ev, onBack }: { ev: EventItem; onBack: () => void }) {
  const cat = CATEGORIES[ev.category];
  const venue = VENUES[ev.venue] || ev.venue;
  const ds = ev.endDate ? `${formatFull(ev.date)} – ${formatFull(ev.endDate)}` : formatFull(ev.date);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
      <div onClick={onBack} style={{ cursor: "pointer", fontSize: 13, color: "#aaa", marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>←</span> agenda
      </div>
      <div style={{ width: "100%", paddingBottom: "50%", position: "relative", overflow: "hidden", background: "#f2f0ed", marginBottom: 28 }}>
        <img src={ev.image} alt={ev.title} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(15%)" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "lowercase", letterSpacing: "0.04em", color: cat.color, display: "block", marginBottom: 10 }}>{cat.label}</span>
      <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, fontWeight: 400, lineHeight: 1.15, color: "#1a1a1a", marginBottom: 10 }}>{ev.title}</h1>
      {ev.subtitle && <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 19, fontWeight: 400, fontStyle: "italic", color: "#777", lineHeight: 1.35, marginBottom: 20 }}>{ev.subtitle}</p>}
      <div style={{ fontSize: 13, color: "#888", lineHeight: 2.2, marginBottom: 28, borderBottom: "1px solid #eee", paddingBottom: 24 }}>
        <div>{ds}{ev.time ? ` · ${ev.time}` : ""}</div>
        <div>{venue}</div>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: "#444", fontWeight: 300 }}>{ev.description}</p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const [cat, setCat] = useState("todos");
  const [time, setTime] = useState("todos");
  const [sel, setSel] = useState<EventItem | null>(null);
  const [ddOpen, setDd] = useState(false);

  const featured = useMemo(() =>
    EVENTS.filter(e => e.featured).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3),
  []);

  const list = useMemo(() => {
    let l = [...EVENTS].sort((a, b) => a.date.localeCompare(b.date));
    if (cat !== "todos") l = l.filter(e => e.category === cat);
    if (time === "hoje") l = l.filter(e => inRange(e.date, e.endDate, isToday));
    else if (time === "semana") l = l.filter(e => inRange(e.date, e.endDate, isThisWeek));
    else if (time === "fds") l = l.filter(e => inRange(e.date, e.endDate, isThisWeekend));
    return l;
  }, [cat, time]);

  const grouped = useMemo(() => {
    const g: Record<string, EventItem[]> = {};
    list.forEach(e => { const m = monthKey(e.date); if (!g[m]) g[m] = []; g[m].push(e); });
    return g;
  }, [list]);

  const months = Object.keys(grouped);

  if (sel) return <Detail ev={sel} onBack={() => setSel(null)} />;

  return (
    <div style={{ maxWidth: 100%, margin: "0 auto", padding: "0 28px" }}>
      {/* Header */}
      <header style={{ padding: "44px 0 0", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: "-0.01em" }}>
            Agenda Barreiro
          </h1>
          <span style={{ fontSize: 11, color: "#ccc", fontWeight: 300 }}>2025–2026</span>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        position: "sticky", top: 0, background: "#fff", zIndex: 10,
        paddingTop: 16, paddingBottom: 14,
        borderBottom: "1px solid #e0e0e0", borderTop: "1px solid #e0e0e0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", gap: 24 }}>
          {([["todos", "Agenda"], ["hoje", "Hoje"], ["semana", "Esta semana"], ["fds", "Fim\u2011de\u2011semana"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTime(k)} style={{
              background: "none", border: "none", fontSize: 13,
              fontWeight: time === k ? 500 : 300,
              color: time === k ? "#1a1a1a" : "#aaa",
              padding: "2px 0",
              borderBottom: time === k ? "2px solid #1a1a1a" : "2px solid transparent",
              transition: "all .15s",
            }}>{label}</button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setDd(!ddOpen)} style={{
            background: "none", border: "1px solid #ddd", borderRadius: 3,
            fontSize: 12, color: cat === "todos" ? "#999" : CATEGORIES[cat]?.color,
            padding: "5px 26px 5px 10px", fontWeight: cat === "todos" ? 300 : 500,
            position: "relative",
          }}>
            {cat === "todos" ? "Todos os Eventos" : CATEGORIES[cat]?.label}
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: "#bbb" }}>▾</span>
          </button>
          {ddOpen && (
            <div style={{
              position: "absolute", top: "110%", right: 0, background: "#fff",
              border: "1px solid #e8e8e8", boxShadow: "0 6px 20px rgba(0,0,0,.07)",
              zIndex: 20, minWidth: 190, padding: "6px 0", borderRadius: 3,
            }}>
              <div onClick={() => { setCat("todos"); setDd(false); }}
                style={{ padding: "8px 16px", fontSize: 12, cursor: "pointer", color: "#999", fontWeight: cat === "todos" ? 500 : 300 }}>
                Todos os Eventos
              </div>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <div key={k} onClick={() => { setCat(k); setDd(false); }}
                  style={{ padding: "8px 16px", fontSize: 12, cursor: "pointer", color: v.color, fontWeight: cat === k ? 500 : 300, textTransform: "capitalize" }}>
                  {v.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Featured */}
      {time === "todos" && cat === "todos" && (
        <section style={{ paddingTop: 36, paddingBottom: 12 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 15, fontWeight: 400, fontStyle: "italic", color: "#bbb", marginBottom: 20, textTransform: "capitalize" }}>
            em destaque
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
            {featured.map(ev => <Card key={ev.id} ev={ev} onClick={setSel} />)}
          </div>
        </section>
      )}

      {/* Month anchors */}
      {months.length > 1 && (
        <div style={{ display: "flex", gap: 20, padding: "28px 0 0", flexWrap: "wrap" }}>
          {months.map(m => (
            <span key={m}
              onClick={() => document.getElementById(`m-${m}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{ fontSize: 12, color: "#ccc", cursor: "pointer", textTransform: "capitalize", fontWeight: 300, transition: "color .15s" }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = "#1a1a1a"}
              onMouseLeave={e => (e.target as HTMLElement).style.color = "#ccc"}>
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Event list */}
      {months.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, fontWeight: 400, color: "#ccc", fontStyle: "italic" }}>
            Sem eventos para esta selecção.
          </p>
        </div>
      ) : (
        months.map(m => (
          <section key={m} id={`m-${m}`} style={{ scrollMarginTop: 80 }}>
            <h2 style={{
              fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 15,
              fontWeight: 400, fontStyle: "italic", color: "#ccc",
              marginTop: 40, marginBottom: 20, textTransform: "capitalize",
              borderBottom: "1px solid #f0f0f0", paddingBottom: 10,
            }}>{m}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 24px" }}>
              {grouped[m].map(ev => <Card key={ev.id} ev={ev} onClick={setSel} />)}
            </div>
          </section>
        ))
      )}

      {/* Footer */}
      <footer style={{ marginTop: 64, padding: "24px 0 44px", borderTop: "1px solid #e8e8e8" }}>
        <p style={{ fontSize: 11, color: "#ccc", lineHeight: 2, fontWeight: 300 }}>
          Agenda Barreiro é um projecto independente.<br />
          Fontes: CM Barreiro · Viral Agenda · OUT.RA · Cooperativa Mula · Rostos · New in Barreiro<br />
          Sugerir evento → agendabarreiro@email.pt
        </p>
      </footer>
    </div>
  );
}