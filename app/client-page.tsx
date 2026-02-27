'use client';

import { useState, useMemo } from 'react';

// ─── Demo data (usado quando não há dados do servidor) ───────

const DEMO = [
  { id:1, t:"António Zambujo", s:"Oração ao Tempo", cat:"Música", d:"2026-03-21", tm:"22:00", loc:"Auditório Municipal Augusto Cabrita", pr:"€25", desc:"Novo álbum em dueto com Caetano Veloso. Digressão contínua há mais de duas décadas.", u:"https://www.cm-barreiro.pt/eventos/antonio-zambujo-concerto/", f:1 },
  { id:2, t:"Ivandro", s:"52 anos do 25 de Abril", cat:"Música", d:"2026-04-25", tm:"22:00", loc:"Parque da Cidade", pr:"Gratuito", desc:"Concerto integrado nas comemorações dos 52 anos do 25 de Abril.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/", f:1 },
  { id:3, t:"IlustraBD", s:"7ª Mostra de BD e Ilustração", cat:"Exposição", d:"2026-04-11", ed:"2026-04-12", loc:"Auditório Municipal Augusto Cabrita", pr:"Gratuito", desc:"Exposições, conversas com autores, feira de livro, oficinas e visitas guiadas.", u:"https://www.cm-barreiro.pt/eventos/5a-edicao-ilustrabd/", f:1 },
  { id:4, t:"Machada Trail Noturno", s:"2ª edição", cat:"Desporto", d:"2026-04-11", loc:"Mata Nacional da Machada", pr:"Inscrição", desc:"20Km Trail Longo, 13Km Sprint, 8Km Caminhada e 1Km Trail Kids.", u:"https://www.cm-barreiro.pt/eventos/barreiro-machada-trail-noturno-2026/", f:1 },
  { id:5, t:"Oficina Eco de Memórias", s:"Ana Biscaia e Paula Delecave", cat:"Workshop", d:"2026-03-01", tm:"10:00", loc:"AMAC – Galeria Branca", pr:"€5", desc:"Jogos de memória, reconhecimento do espaço, mapas de memórias. M/8 anos. 120 min.", u:"https://www.cm-barreiro.pt/eventos/oficina-eco-de-memorias-com-ana-biscaia-e-paula-delecave/" },
  { id:6, t:"Circuito de Xadrez", s:"GD Ferroviários do Barreiro", cat:"Desporto", d:"2026-03-01", tm:"15:00", loc:"GD Ferroviários – Sede", pr:"Gratuito", desc:"27ª edição. Aberto a todos os interessados.", u:"https://www.cm-barreiro.pt/eventos/circuito-de-torneios-de-xadrez-do-barreiro-2026/" },
  { id:7, t:"Visitas ao Património", s:"Roteiros de primavera", cat:"Visitas", d:"2026-03-08", ed:"2026-04-30", loc:"Vários locais do Barreiro", pr:"Gratuito", desc:"Roteiros de visita ao património do concelho.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:8, t:"Fados no Mercado", s:"Noite de fado", cat:"Música", d:"2026-03-14", tm:"21:00", loc:"Mercado Municipal 1º de Maio", pr:"A confirmar", desc:"Noite de fado no cenário único do Mercado Municipal.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:9, t:"Circuito de Xadrez", s:"FC Barreirense", cat:"Desporto", d:"2026-03-15", tm:"15:00", loc:"FC Barreirense – Sede", pr:"Gratuito", desc:"27ª edição. Aberto a todos.", u:"https://www.cm-barreiro.pt/eventos/circuito-de-torneios-de-xadrez-do-barreiro-2026/" },
  { id:10, t:"Festival de Bebés", s:"Circuito de Natação", cat:"Desporto", d:"2026-03-21", ed:"2026-03-22", loc:"Piscina Municipal do Lavradio", pr:"Gratuito", desc:"Atividade lúdica para bebés com dois adultos.", u:"https://www.cm-barreiro.pt/eventos/2o-festival-de-bebes-circuito-de-natacao-do-barreiro-2025-2026/" },
  { id:11, t:"Desfile da Liberdade", s:"52 anos do 25 de Abril", cat:"Comunidade", d:"2026-04-24", tm:"20:00", loc:"StartUp Barreiro → Largo N. Sra. Rosário", pr:"Gratuito", desc:"Desfile pelas ruas do Barreiro.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:12, t:"Tiago Sousa", s:"Apresentação de novo disco", cat:"Música", d:"2026-03-28", tm:"21:30", loc:"Auditório Municipal Augusto Cabrita", pr:"A confirmar", desc:"Apresentação do novo álbum de Tiago Sousa.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:13, t:"Circuito de Xadrez", s:"GD Independente Quinta Lomba", cat:"Desporto", d:"2026-03-29", tm:"15:00", loc:"Quinta Lomba – Sede", pr:"Gratuito", desc:"27ª edição.", u:"https://www.cm-barreiro.pt/eventos/circuito-de-torneios-de-xadrez-do-barreiro-2026/" },
  { id:14, t:"Põe-te a Funcionar!", s:"Projectos jovens 14–30 anos", cat:"Comunidade", d:"2026-03-01", ed:"2026-03-31", loc:"Vários locais", pr:"Gratuito", desc:"Música, arte urbana, dança e outras intervenções artísticas.", u:"https://www.cm-barreiro.pt/eventos/cria-o-teu-projeto-2026/" },
  { id:15, t:"Ode Flamenca", s:"Espetáculo de dança", cat:"Dança", d:"2026-04-05", tm:"21:00", loc:"Auditório Municipal Augusto Cabrita", pr:"A confirmar", desc:"Dança flamenca no programa de artes performativas.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:16, t:"Concerto Evocativo", s:"Banda Municipal, Camerata & Orquestra Baía", cat:"Música", d:"2026-04-25", tm:"16:00", loc:"Auditório Municipal Augusto Cabrita", pr:"Gratuito", desc:"Concerto evocativo dos 52 anos da Revolução dos Cravos.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
];

// ─── Types & constants ───────────────────────────────────────

interface EV {
  id: any; t: string; s: string; cat: string; d: string;
  tm?: string; ed?: string; loc: string; pr: string;
  desc: string; u: string; f?: number;
}

const CATS = ["Música","Exposição","Dança","Desporto","Workshop","Visitas","Comunidade"];
const CC: Record<string, string> = {
  Música:"#E63946", Exposição:"#F4A261", Dança:"#9B5DE5", Desporto:"#06D6A0",
  Workshop:"#F72585", Visitas:"#4CC9F0", Comunidade:"#FFD166",
};
const MF = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DN = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const dt = (d: string) => new Date(d + "T00:00:00");
const fontStack = "'Inter', 'Helvetica Neue', Arial, system-ui, sans-serif";

// ─── Map server events to internal format ────────────────────

function mapServerEvents(events: any[]): EV[] {
  return events.map((e: any, i: number) => ({
    id: e.id || i + 1,
    t: e.title || '',
    s: e.subtitle || '',
    cat: e.category || 'Comunidade',
    d: e.date || '',
    tm: e.time,
    ed: e.endDate,
    loc: e.location || '',
    pr: e.price || '',
    desc: e.description || '',
    u: e.url || '',
    f: e.featured ? 1 : undefined,
  }));
}

// ─── Component ───────────────────────────────────────────────

interface Props {
  events?: any[];
  updatedAt?: string | null;
}

export default function ClientPage({ events: serverEvents, updatedAt }: Props) {
  // Use server data if available, otherwise demo
  const ALL: EV[] = serverEvents && serverEvents.length > 0
    ? mapServerEvents(serverEvents)
    : DEMO;

  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [mo, setMo] = useState("all");
  const [sel, setSel] = useState<any>(null);
  const [hov, setHov] = useState<any>(null);

  const filtered = useMemo(() => {
    let e = ALL;
    if (cat) e = e.filter(x => x.cat === cat);
    if (mo !== "all") e = e.filter(x => x.d.slice(5, 7) === mo);
    if (q) {
      const s = q.toLowerCase();
      e = e.filter(x => (x.t + x.s + x.loc + x.desc + x.cat).toLowerCase().includes(s));
    }
    return e.sort((a, b) => a.d.localeCompare(b.d));
  }, [cat, q, mo, ALL]);

  const grouped = useMemo(() => {
    const months: Record<string, EV[]> = {};
    filtered.forEach(e => {
      const k = e.d.slice(0, 7);
      if (!months[k]) months[k] = [];
      months[k].push(e);
    });
    return Object.entries(months);
  }, [filtered]);

  const featured = ALL.filter(e => e.f);
  const ev = sel ? ALL.find(e => e.id === sel) : null;

  // ─── DETAIL VIEW ──────────────────────────
  if (ev) {
    const c = CC[ev.cat] || "#333";
    return (
      <div style={{ fontFamily: fontStack, background: "#fff", minHeight: "100vh" }}>
        <div style={{ height: 6, background: c }} />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
          <button onClick={() => setSel(null)} style={{ all: "unset", cursor: "pointer", fontSize: 14, color: "#999", display: "flex", alignItems: "center", gap: 6, marginBottom: 40 }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>←</span> voltar à agenda
          </button>

          <div style={{ display: "inline-block", background: c, color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", padding: "5px 12px", marginBottom: 24 }}>
            {ev.cat}
          </div>

          <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 0.95, letterSpacing: -2.5, margin: "0 0 8px", color: "#0a0a0a" }}>{ev.t}</h1>
          <p style={{ fontSize: 20, color: "#888", margin: "0 0 48px", fontWeight: 400 }}>{ev.s}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 0, border: "1px solid #eee", marginBottom: 40 }}>
            {[
              ["Data", ev.ed ? `${dt(ev.d).getDate()} ${MF[dt(ev.d).getMonth()]} — ${dt(ev.ed).getDate()} ${MS[dt(ev.ed).getMonth()]}` : `${dt(ev.d).getDate()} ${MF[dt(ev.d).getMonth()]} ${dt(ev.d).getFullYear()}`],
              ["Hora", ev.tm ? ev.tm : "—"],
              ["Local", ev.loc],
              ["Preço", ev.pr || "—"],
            ].map(([l, v], i) => (
              <div key={i} style={{ padding: "20px 24px", borderBottom: i < 2 ? "1px solid #eee" : "none", borderRight: i % 2 === 0 ? "1px solid #eee" : "none" }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: l === "Preço" && v === "Gratuito" ? "#06D6A0" : "#222" }}>{v}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 17, lineHeight: 1.85, color: "#444", margin: "0 0 40px" }}>{ev.desc}</p>

          <a href={ev.u} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: c, color: "#fff", padding: "14px 28px", textDecoration: "none", fontSize: 14, fontWeight: 700, letterSpacing: 0.3 }}>
            Ver em cm-barreiro.pt <span style={{ fontSize: 16 }}>↗</span>
          </a>
        </div>
      </div>
    );
  }

  // ─── MAIN VIEW ────────────────────────────
  return (
    <div style={{ fontFamily: fontStack, background: "#fff", minHeight: "100vh", color: "#0a0a0a" }}>

      {/* HEADER */}
      <header style={{ background: "#0a0a0a", color: "#fff", padding: "32px 32px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: "#E63946", marginBottom: 8 }}>Agenda Cultural</div>
            <h1 style={{ fontSize: 64, fontWeight: 900, letterSpacing: -4, lineHeight: 0.85, margin: 0 }}>
              Barreiro
            </h1>
          </div>
          <div style={{ textAlign: "right", paddingBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#666" }}>Mar — Abr</div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -2, color: "#333" }}>2026</div>
          </div>
        </div>
      </header>

      {/* FEATURED (São Luiz style) */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {featured.map((e, i) => {
          const c = CC[e.cat] || "#333";
          const isWide = i === 0;
          const h = hov === "f" + e.id;
          return (
            <div key={e.id}
              onClick={() => setSel(e.id)}
              onMouseEnter={() => setHov("f" + e.id)}
              onMouseLeave={() => setHov(null)}
              style={{
                gridColumn: isWide ? "span 2" : "auto",
                background: c, color: "#fff",
                padding: isWide ? "48px 40px" : "36px 32px",
                cursor: "pointer", position: "relative", overflow: "hidden",
                transition: "filter .3s",
                filter: h ? "brightness(1.1)" : "brightness(1)",
                minHeight: isWide ? 220 : 180,
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
              }}>
              <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: "linear-gradient(135deg, transparent 60%, rgba(0,0,0,0.15))", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", opacity: 0.7, marginBottom: isWide ? 12 : 8 }}>{e.cat}</div>
                <div style={{ fontSize: isWide ? 48 : 32, fontWeight: 900, lineHeight: 0.95, letterSpacing: isWide ? -2.5 : -1.5, marginBottom: 6 }}>{e.t}</div>
                <div style={{ fontSize: isWide ? 18 : 14, opacity: 0.8, fontWeight: 400, marginBottom: isWide ? 20 : 12 }}>{e.s}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, opacity: 0.7 }}>
                  <span>{dt(e.d).getDate()} {MF[dt(e.d).getMonth()]}{e.ed ? ` — ${dt(e.ed).getDate()} ${MS[dt(e.ed).getMonth()]}` : ""}</span>
                  <span style={{ fontWeight: 700, opacity: 1, background: "rgba(255,255,255,0.2)", padding: "3px 10px" }}>{e.pr}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* FILTERS */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", borderBottom: "2px solid #0a0a0a" }}>
        <div style={{ padding: "12px 32px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 0, flex: 1, flexWrap: "wrap" }}>
            {CATS.map(c => {
              const active = cat === c;
              const col = CC[c];
              return (
                <button key={c} onClick={() => setCat(active ? null : c)} style={{
                  all: "unset", cursor: "pointer",
                  padding: "6px 14px", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
                  color: active ? "#fff" : "#999",
                  background: active ? col : "transparent",
                  transition: "all .2s",
                }}>{c}</button>
              );
            })}
          </div>
          <select value={mo} onChange={e => setMo(e.target.value)} style={{ padding: "5px 10px", border: "2px solid #0a0a0a", fontSize: 12, fontWeight: 700, background: "#fff", fontFamily: fontStack, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <option value="all">Mês</option>
            <option value="03">Mar</option>
            <option value="04">Abr</option>
          </select>
          <input type="text" placeholder="Pesquisar…" value={q} onChange={e => setQ(e.target.value)}
            style={{ padding: "5px 12px", border: "2px solid #0a0a0a", fontSize: 12, width: 160, fontFamily: fontStack, outline: "none" }} />
        </div>
      </div>

      {/* EVENT LIST */}
      <section style={{ padding: "0 0 64px" }}>
        {grouped.map(([monthKey, evts]) => {
          const mIdx = parseInt(monthKey.slice(5, 7)) - 1;
          return (
            <div key={monthKey}>
              <div style={{ background: "#0a0a0a", color: "#fff", padding: "16px 32px", fontSize: 11, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase" }}>
                {MF[mIdx]} {monthKey.slice(0, 4)}
              </div>
              {evts.map((e) => {
                const c = CC[e.cat] || "#333";
                const h = hov === e.id;
                const d = dt(e.d);
                return (
                  <div key={e.id}
                    onClick={() => setSel(e.id)}
                    onMouseEnter={() => setHov(e.id)}
                    onMouseLeave={() => setHov(null)}
                    style={{
                      display: "grid", gridTemplateColumns: "100px 6px 1fr auto",
                      borderBottom: "1px solid #eee", cursor: "pointer",
                      background: h ? "#FAFAF8" : "#fff", transition: "background .15s",
                    }}>
                    <div style={{ padding: "20px 16px 20px 32px", textAlign: "right" }}>
                      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: "#0a0a0a", letterSpacing: -1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#bbb", textTransform: "uppercase", letterSpacing: 1 }}>{DN[d.getDay()]}</div>
                      {e.tm && <div style={{ fontSize: 12, fontWeight: 700, color: "#999", marginTop: 4 }}>{e.tm}</div>}
                    </div>
                    <div style={{ background: c }} />
                    <div style={{ padding: "20px 24px" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: c, marginBottom: 4 }}>{e.cat}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.5, color: "#0a0a0a", marginBottom: 3 }}>{e.t}</div>
                      <div style={{ fontSize: 14, color: "#888" }}>{e.s}</div>
                      <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>{e.loc}</div>
                    </div>
                    <div style={{ padding: "20px 32px 20px 16px", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: e.pr === "Gratuito" ? "#06D6A0" : "#666" }}>{e.pr}</div>
                      {e.ed && <div style={{ fontSize: 11, color: "#ccc", marginTop: 4 }}>até {dt(e.ed).getDate()} {MS[dt(e.ed).getMonth()]}</div>}
                      <span style={{ fontSize: 18, color: h ? c : "transparent", transition: "color .2s", marginTop: 4 }}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 32px", color: "#ccc" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>∅</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Sem eventos encontrados</div>
            <button onClick={() => { setCat(null); setQ(""); setMo("all"); }}
              style={{ all: "unset", cursor: "pointer", marginTop: 16, display: "inline-block", padding: "8px 20px", border: "2px solid #0a0a0a", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0a0a0a", color: "#666", padding: "28px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <div>
            <span style={{ fontWeight: 800, color: "#fff", letterSpacing: 1 }}>Agenda Barreiro</span>
            <span style={{ margin: "0 8px", color: "#333" }}>·</span>
            <span>Projecto independente</span>
            {updatedAt && <span style={{ margin: "0 8px", color: "#333" }}>·</span>}
            {updatedAt && <span>Actualizado: {new Date(updatedAt).toLocaleDateString('pt-PT')}</span>}
          </div>
          <a href="https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" target="_blank" rel="noopener noreferrer" style={{ color: "#E63946", textDecoration: "none", fontWeight: 700 }}>
            cm-barreiro.pt ↗
          </a>
        </div>
      </footer>
    </div>
  );
}