'use client';

import { useState, useMemo } from 'react';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800;900&display=swap';

const DEMO = [
  { id:1, t:"António Zambujo", s:"Oração ao Tempo", cat:"Música", d:"2026-03-21", tm:"22:00", loc:"Auditório Municipal Augusto Cabrita", pr:"€25", desc:"Novo álbum em dueto com Caetano Veloso. Digressão contínua há mais de duas décadas, com canções como Pica do 7, Flagrante e Lambreta.", u:"https://www.cm-barreiro.pt/eventos/antonio-zambujo-concerto/", f:1 },
  { id:2, t:"Ivandro", s:"52 anos do 25 de Abril", cat:"Música", d:"2026-04-25", tm:"22:00", loc:"Parque da Cidade", pr:"Gratuito", desc:"Concerto integrado nas comemorações dos 52 anos do 25 de Abril.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/", f:1 },
  { id:3, t:"IlustraBD", s:"7ª Mostra de BD e Ilustração", cat:"Exposição", d:"2026-04-11", ed:"2026-04-12", loc:"Auditório Municipal Augusto Cabrita", pr:"Gratuito", desc:"Exposições, conversas com autores, feira de livro, oficinas e visitas guiadas.", u:"https://www.cm-barreiro.pt/eventos/5a-edicao-ilustrabd/" },
  { id:4, t:"Machada Trail Noturno", s:"2ª edição", cat:"Desporto", d:"2026-04-11", loc:"Mata Nacional da Machada", pr:"Inscrição", desc:"20Km Trail Longo, 13Km Sprint, 8Km Caminhada e 1Km Trail Kids.", u:"https://www.cm-barreiro.pt/eventos/barreiro-machada-trail-noturno-2026/" },
  { id:5, t:"Oficina Eco de Memórias", s:"Ana Biscaia e Paula Delecave", cat:"Workshop", d:"2026-03-01", tm:"10:00", loc:"AMAC – Galeria Branca", pr:"€5", desc:"Jogos de memória, reconhecimento do espaço, mapas de memórias. M/8 anos. 120 min.", u:"https://www.cm-barreiro.pt/eventos/oficina-eco-de-memorias-com-ana-biscaia-e-paula-delecave/" },
  { id:6, t:"Circuito de Xadrez", s:"GD Ferroviários do Barreiro", cat:"Desporto", d:"2026-03-01", tm:"15:00", loc:"GD Ferroviários – Sede", pr:"Gratuito", desc:"27ª edição. Aberto a todos os interessados.", u:"https://www.cm-barreiro.pt/eventos/circuito-de-torneios-de-xadrez-do-barreiro-2026/" },
  { id:7, t:"Visitas ao Património", s:"Roteiros de primavera", cat:"Visitas", d:"2026-03-08", ed:"2026-04-30", loc:"Vários locais do Barreiro", pr:"Gratuito", desc:"Roteiros de visita ao património do concelho com a chegada da primavera.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:8, t:"Fados no Mercado", s:"Noite de fado", cat:"Música", d:"2026-03-14", tm:"21:00", loc:"Mercado Municipal 1º de Maio", pr:"A confirmar", desc:"Noite de fado no cenário único do Mercado Municipal.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:9, t:"Circuito de Xadrez", s:"FC Barreirense", cat:"Desporto", d:"2026-03-15", tm:"15:00", loc:"FC Barreirense – Sede", pr:"Gratuito", desc:"27ª edição. Aberto a todos.", u:"https://www.cm-barreiro.pt/eventos/circuito-de-torneios-de-xadrez-do-barreiro-2026/" },
  { id:10, t:"Festival de Bebés", s:"Circuito de Natação", cat:"Desporto", d:"2026-03-21", ed:"2026-03-22", loc:"Piscina Municipal do Lavradio", pr:"Gratuito", desc:"Atividade lúdica para bebés com dois adultos.", u:"https://www.cm-barreiro.pt/eventos/2o-festival-de-bebes-circuito-de-natacao-do-barreiro-2025-2026/" },
  { id:11, t:"Desfile da Liberdade", s:"52 anos do 25 de Abril", cat:"Comunidade", d:"2026-04-24", tm:"20:00", loc:"StartUp Barreiro → Largo N. Sra. Rosário", pr:"Gratuito", desc:"Desfile pelas ruas do Barreiro.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:12, t:"Tiago Sousa", s:"Apresentação de novo disco", cat:"Música", d:"2026-03-28", tm:"21:30", loc:"Auditório Municipal Augusto Cabrita", pr:"A confirmar", desc:"Apresentação do novo álbum de Tiago Sousa.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:13, t:"Cem Peixes", s:"Exposição de Pedro Salgado", cat:"Exposição", d:"2026-01-31", ed:"2026-03-22", loc:"Auditório Municipal Augusto Cabrita", pr:"Gratuito", desc:"Desenho científico e registos em cadernos de campo do biólogo marinho e ilustrador Pedro Salgado.", u:"https://www.cm-barreiro.pt/eventos/exposicao-cem-peixes/" },
  { id:14, t:"Põe-te a Funcionar!", s:"Projectos jovens 14–30 anos", cat:"Comunidade", d:"2026-03-01", ed:"2026-03-31", loc:"Vários locais", pr:"Gratuito", desc:"Música, arte urbana, dança e mais intervenções artísticas propostas por jovens.", u:"https://www.cm-barreiro.pt/eventos/cria-o-teu-projeto-2026/" },
  { id:15, t:"Ode Flamenca", s:"Espetáculo de dança", cat:"Dança", d:"2026-04-05", tm:"21:00", loc:"Auditório Municipal Augusto Cabrita", pr:"A confirmar", desc:"Dança flamenca no programa de artes performativas.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:16, t:"Concerto Evocativo", s:"Banda Municipal, Camerata & Orquestra Baía", cat:"Música", d:"2026-04-25", tm:"16:00", loc:"Auditório Municipal Augusto Cabrita", pr:"Gratuito", desc:"Concerto evocativo dos 52 anos da Revolução dos Cravos.", u:"https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" },
  { id:17, t:"Circuito de Xadrez", s:"GD Independente Quinta Lomba", cat:"Desporto", d:"2026-03-29", tm:"15:00", loc:"Quinta Lomba – Sede", pr:"Gratuito", desc:"27ª edição.", u:"https://www.cm-barreiro.pt/eventos/circuito-de-torneios-de-xadrez-do-barreiro-2026/" },
];

interface EV { id:any; t:string; s:string; cat:string; d:string; tm?:string; ed?:string; loc:string; pr:string; desc:string; u:string; f?:number; img?:string; }

const CATS = ["Música","Exposição","Dança","Desporto","Workshop","Visitas","Comunidade"];
const CC: Record<string,string> = { Música:"#D62828", Exposição:"#E76F51", Dança:"#9B5DE5", Desporto:"#2A9D8F", Workshop:"#F72585", Visitas:"#4895EF", Comunidade:"#E9C46A" };
const MF = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const dt = (d:string) => new Date(d+"T00:00:00");

function mapServer(events:any[]): EV[] {
  return events.map((e:any,i:number) => ({ id:e.id||i+1, t:e.title||'', s:e.subtitle||'', cat:e.category||'Comunidade', d:e.date||'', tm:e.time, ed:e.endDate, loc:e.location||'', pr:e.price||'', desc:e.description||'', u:e.url||'', f:e.featured?1:undefined, img:e.imageUrl }));
}

interface Props { events?:any[]; updatedAt?:string|null; }

export default function ClientPage({ events:srv, updatedAt }: Props) {
  const ALL = srv && srv.length > 0 ? mapServer(srv) : DEMO;
  const [cat, setCat] = useState<string|null>(null);
  const [q, setQ] = useState("");
  const [mo, setMo] = useState("all");
  const [sel, setSel] = useState<any>(null);
  const [hov, setHov] = useState<any>(null);

  const filtered = useMemo(() => {
    let e = ALL;
    if (cat) e = e.filter(x => x.cat === cat);
    if (mo !== "all") e = e.filter(x => x.d.slice(5,7) === mo);
    if (q) { const s=q.toLowerCase(); e = e.filter(x => (x.t+x.s+x.loc+x.desc+x.cat).toLowerCase().includes(s)); }
    return e.sort((a,b) => a.d.localeCompare(b.d));
  }, [cat, q, mo, ALL]);

  const grouped = useMemo(() => {
    const m: Record<string, EV[]> = {};
    filtered.forEach(e => { const k = e.d.slice(0,7); if (!m[k]) m[k]=[]; m[k].push(e); });
    return Object.entries(m);
  }, [filtered]);

  const ev = sel ? ALL.find(e => e.id === sel) : null;
  const serif = "'Instrument Serif', Georgia, serif";
  const sans = "'Inter', system-ui, sans-serif";

  // ─── DETAIL VIEW (São Luiz style) ─────────
  if (ev) {
    const c = CC[ev.cat] || "#333";
    return (
      <>
        <link href={FONT_LINK} rel="stylesheet" />
        <div style={{ fontFamily:sans, background:"#fff", minHeight:"100vh" }}>
          <div style={{ background:c, padding:"24px 40px", display:"flex", alignItems:"center", gap:16 }}>
            <button onClick={() => setSel(null)} style={{ all:"unset", cursor:"pointer", color:"#fff", fontSize:14, display:"flex", alignItems:"center", gap:6, opacity:.8 }}>
              <span style={{ fontSize:20 }}>←</span> voltar
            </button>
            <span style={{ fontFamily:serif, fontSize:20, fontStyle:"italic", color:"rgba(255,255,255,.6)" }}>Agenda Barreiro</span>
          </div>
          {/* Image if available */}
          {ev.img && <div style={{ width:"100%", height:400, overflow:"hidden" }}>
            <img src={ev.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>}
          <div style={{ maxWidth:720, margin:"0 auto", padding:"48px 32px" }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:c, marginBottom:16 }}>{ev.cat}</div>
            <h1 style={{ fontFamily:serif, fontSize:56, fontStyle:"italic", fontWeight:400, lineHeight:1, margin:"0 0 8px", color:"#0a0a0a" }}>{ev.t}</h1>
            <p style={{ fontSize:18, color:"#888", margin:"0 0 48px" }}>{ev.s}</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, border:"1px solid #eee", marginBottom:40 }}>
              {[
                ["Data", ev.ed ? `${dt(ev.d).getDate()} ${MF[dt(ev.d).getMonth()]} — ${dt(ev.ed).getDate()} ${MS[dt(ev.ed).getMonth()]}` : `${dt(ev.d).getDate()} ${MF[dt(ev.d).getMonth()]} ${dt(ev.d).getFullYear()}`],
                ["Hora", ev.tm || "—"], ["Local", ev.loc], ["Preço", ev.pr || "—"],
              ].map(([l,v],i) => (
                <div key={i} style={{ padding:"20px 24px", borderBottom:i<2?"1px solid #eee":"none", borderRight:i%2===0?"1px solid #eee":"none" }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#bbb", marginBottom:6 }}>{l}</div>
                  <div style={{ fontSize:15, fontWeight:600, color: l==="Preço"&&v==="Gratuito" ? "#2A9D8F" : "#222" }}>{v}</div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily:serif, fontSize:20, lineHeight:1.7, color:"#333", fontStyle:"italic" }}>{ev.desc}</p>
            <a href={ev.u} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#0a0a0a", color:"#fff", padding:"14px 28px", textDecoration:"none", fontSize:13, fontWeight:700, marginTop:32 }}>
              Ver em cm-barreiro.pt ↗
            </a>
          </div>
        </div>
      </>
    );
  }

  // ─── MAIN VIEW (São Luiz layout) ──────────
  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div style={{ fontFamily:sans, background:"#fff", minHeight:"100vh", color:"#0a0a0a" }}>

        {/* ─── HEADER ─── */}
        <header style={{ padding:"28px 40px", display:"flex", justifyContent:"space-between", alignItems:"flex-end", borderBottom:"1px solid #eee" }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:3, textTransform:"uppercase", color:"#bbb", marginBottom:4 }}>Agenda Cultural</div>
            <h1 style={{ fontFamily:serif, fontSize:48, fontStyle:"italic", fontWeight:400, margin:0, lineHeight:1, color:"#0a0a0a" }}>Barreiro</h1>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:serif, fontSize:24, fontStyle:"italic", color:"#bbb" }}>2025–2026</div>
          </div>
        </header>

        {/* ─── HERO BANNER ─── */}
        {(() => {
          const hero = ALL.find(e => e.f) || ALL[0];
          if (!hero) return null;
          const c = CC[hero.cat] || "#333";
          const d = dt(hero.d);
          const hasImg = !!hero.img;
          return (
            <div onClick={() => setSel(hero.id)}
              onMouseEnter={() => setHov("hero")}
              onMouseLeave={() => setHov(null)}
              style={{
                position:"relative", overflow:"hidden", cursor:"pointer",
                background: hasImg ? "#0a0a0a" : c,
                minHeight: 420,
                display:"flex", alignItems:"flex-end",
              }}>
              {hasImg && <img src={hero.img} alt="" style={{
                position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
                transition:"transform .6s", transform: hov==="hero" ? "scale(1.03)" : "scale(1)",
              }} />}
              <div style={{ position:"absolute", inset:0, background: hasImg
                ? "linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.3) 100%)"
                : "linear-gradient(135deg, transparent 50%, rgba(0,0,0,.2))",
                pointerEvents:"none" }} />
              <div style={{ position:"relative", zIndex:1, padding:"48px 40px", width:"100%", maxWidth:800 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color: hasImg ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.7)", marginBottom:12 }}>{hero.cat}</div>
                <h2 style={{ fontFamily:serif, fontSize:64, fontStyle:"italic", fontWeight:400, lineHeight:.9, margin:"0 0 10px", color:"#fff", letterSpacing:-1 }}>{hero.t}</h2>
                <p style={{ fontSize:18, color:"rgba(255,255,255,.7)", margin:"0 0 20px" }}>{hero.s}</p>
                <div style={{ display:"flex", gap:20, fontSize:14, color:"rgba(255,255,255,.5)", alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontWeight:600, color:"rgba(255,255,255,.8)" }}>{d.getDate()} {MF[d.getMonth()]}{hero.tm ? ` · ${hero.tm}` : ""}</span>
                  <span>{hero.loc}</span>
                  <span style={{ background:"rgba(255,255,255,.15)", padding:"3px 12px", fontWeight:700, color: hero.pr==="Gratuito" ? "#06D6A0" : "#fff" }}>{hero.pr}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ─── FILTERS (like São Luiz category dropdown) ─── */}
        <div style={{ position:"sticky", top:0, zIndex:20, background:"#fff", borderBottom:"1px solid #eee" }}>
          <div style={{ padding:"12px 40px", display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={() => { setCat(null); setMo("all"); setQ(""); }} style={{
              all:"unset", cursor:"pointer", padding:"5px 14px", fontSize:11, fontWeight:700, letterSpacing:.5, textTransform:"uppercase",
              color: !cat ? "#fff" : "#999", background: !cat ? "#0a0a0a" : "transparent", borderRadius:3, transition:"all .15s",
            }}>Todos</button>
            {CATS.map(c => {
              const active = cat === c; const col = CC[c];
              return (<button key={c} onClick={() => setCat(active?null:c)} style={{
                all:"unset", cursor:"pointer", padding:"5px 14px", fontSize:11, fontWeight:700, letterSpacing:.5, textTransform:"uppercase",
                color: active ? "#fff" : "#999", background: active ? col : "transparent", borderRadius:3, transition:"all .15s",
              }}>{c}</button>);
            })}
            <div style={{ flex:1 }} />
            <select value={mo} onChange={e => setMo(e.target.value)} style={{ padding:"5px 10px", border:"1px solid #ddd", borderRadius:4, fontSize:12, fontWeight:600, background:"#fff", fontFamily:sans, color:"#555" }}>
              <option value="all">Todos os meses</option>
              <option value="01">Janeiro</option><option value="02">Fevereiro</option><option value="03">Março</option><option value="04">Abril</option>
            </select>
            <input type="text" placeholder="Pesquisar…" value={q} onChange={e => setQ(e.target.value)}
              style={{ padding:"5px 12px", border:"1px solid #ddd", borderRadius:4, fontSize:12, width:180, fontFamily:sans, outline:"none", color:"#333" }} />
          </div>
        </div>

        {/* ─── EVENTS BY MONTH (São Luiz layout: month header + full-width cards) ─── */}
        <section>
          {grouped.map(([monthKey, evts]) => {
            const mIdx = parseInt(monthKey.slice(5,7)) - 1;
            return (
              <div key={monthKey}>
                {/* Month header */}
                <div style={{ padding:"32px 40px 16px", borderBottom:"1px solid #eee" }}>
                  <h2 style={{ fontFamily:serif, fontSize:36, fontStyle:"italic", fontWeight:400, margin:0, color:"#0a0a0a" }}>
                    {MF[mIdx]}
                  </h2>
                </div>

                {/* Event cards — full width, São Luiz style */}
                {evts.map(e => {
                  const c = CC[e.cat] || "#333";
                  const h = hov === e.id;
                  const d = dt(e.d);
                  const hasImg = !!e.img;
                  return (
                    <div key={e.id}
                      onClick={() => setSel(e.id)}
                      onMouseEnter={() => setHov(e.id)}
                      onMouseLeave={() => setHov(null)}
                      style={{
                        display:"grid",
                        gridTemplateColumns: hasImg ? "280px 1fr" : "1fr",
                        borderBottom:"1px solid #eee",
                        cursor:"pointer",
                        transition:"background .15s",
                        background: h ? "#FAFAF7" : "#fff",
                      }}>
                      {/* Image or color block */}
                      {hasImg ? (
                        <div style={{ overflow:"hidden", height:"100%", minHeight:180 }}>
                          <img src={e.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .4s", transform: h ? "scale(1.04)" : "scale(1)" }} />
                        </div>
                      ) : null}

                      {/* Content */}
                      <div style={{ padding:"28px 40px", display:"flex", gap:24, alignItems:"flex-start" }}>
                        {/* Color accent bar (São Luiz style) */}
                        {!hasImg && <div style={{ width:4, minHeight:60, background:c, borderRadius:2, flexShrink:0, marginTop:4 }} />}

                        <div style={{ flex:1 }}>
                          {/* Date line */}
                          <div style={{ fontSize:13, color:"#999", marginBottom:8 }}>
                            <span style={{ fontWeight:600 }}>{d.getDate()} {MS[d.getMonth()]}</span>
                            {e.ed && <span> – {dt(e.ed).getDate()} {MS[dt(e.ed).getMonth()]}</span>}
                            {e.tm && <span style={{ marginLeft:8, color:"#bbb" }}>{e.tm}</span>}
                          </div>

                          {/* Category */}
                          <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:c, marginBottom:8 }}>{e.cat}</div>

                          {/* Title */}
                          <h3 style={{ fontFamily:serif, fontSize:28, fontStyle:"italic", fontWeight:400, lineHeight:1.1, margin:"0 0 4px", color:"#0a0a0a" }}>{e.t}</h3>

                          {/* Subtitle */}
                          <p style={{ fontSize:14, color:"#888", margin:"0 0 8px" }}>{e.s}</p>

                          {/* Location */}
                          <div style={{ fontSize:12, color:"#bbb" }}>{e.loc}</div>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign:"right", flexShrink:0, paddingTop:4 }}>
                          <div style={{ fontSize:13, fontWeight:700, color: e.pr==="Gratuito" ? "#2A9D8F" : "#666" }}>{e.pr}</div>
                          {h && <div style={{ fontSize:16, color:c, marginTop:8, transition:"opacity .2s" }}>→</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"80px 40px", color:"#ccc" }}>
              <div style={{ fontFamily:serif, fontSize:36, fontStyle:"italic", marginBottom:12 }}>Sem eventos encontrados</div>
              <button onClick={() => { setCat(null); setQ(""); setMo("all"); }}
                style={{ all:"unset", cursor:"pointer", marginTop:12, padding:"8px 20px", border:"1px solid #ddd", borderRadius:4, fontSize:12, fontWeight:600, color:"#888" }}>
                Limpar filtros
              </button>
            </div>
          )}
        </section>

        {/* ─── FOOTER ─── */}
        <footer style={{ borderTop:"1px solid #eee", padding:"28px 40px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, color:"#bbb" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontFamily:serif, fontSize:18, fontStyle:"italic", color:"#999" }}>Agenda Barreiro</span>
              <span style={{ color:"#ddd" }}>·</span>
              <span>Projecto independente</span>
              {updatedAt && <><span style={{ color:"#ddd" }}>·</span><span>Act. {new Date(updatedAt).toLocaleDateString('pt-PT')}</span></>}
            </div>
            <a href="https://www.cm-barreiro.pt/conhecer/agenda-de-eventos/" target="_blank" rel="noopener noreferrer" style={{ color:"#D62828", textDecoration:"none", fontWeight:700 }}>
              cm-barreiro.pt ↗
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}