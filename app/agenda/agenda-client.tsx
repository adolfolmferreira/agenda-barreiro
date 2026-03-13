"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import type { Event } from "../components/types";
import {
  fmtRange,
  cleanLoc,
  mk,
  mkLabel,
  MO_FULL,
} from "../components/helpers";

export default function AgendaClient({ events }: { events: Event[] }) {


  const [selCats, setSelCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('categoria');
    if (cat) setSelCats(new Set([cat]));
  }, []);
  const [selMon, setSelMon] = useState("Todos os Meses");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = useMemo(() => {
    const s = new Set(events.map((e) => e.category).filter(Boolean));
    return ["Todos os Eventos", ...Array.from(s).sort()];
  }, [events]);

  const months = useMemo(() => {
    const s = new Set(
      events
        .filter((e) => (e.endDate || e.date) >= "2026-01-01" && e.date <= "2026-06-30")
        .map((e) => e.date < "2026-01-01" && e.endDate && e.endDate >= "2026-01-01" ? "2026-01" : mk(e.date))
        .filter((k) => k.length === 7),
    );
    return ["Todos os Meses", ...Array.from(s).sort().reverse()];
  }, [events]);

  const hero = useMemo(() => {
    const upcoming = events
      .filter((e) => (e.endDate || e.date) >= "2026-01-01" && e.imageUrl)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming.find((e) => e.featured) || upcoming[0] || null;
  }, [events]);

  const filtered = useMemo(() => {
    let list = events.filter(
      (e) => (e.endDate || e.date) >= "2026-01-01" && e.date <= "2026-06-30",
    );
    if (selCats.size > 0)
      list = list.filter((e) => selCats.has(e.category));
    if (selMon !== "Todos os Meses")
      list = list.filter((e) => {
        if (e.date < "2026-01-01" && e.endDate && e.endDate >= "2026-01-01") return selMon === "2026-01";
        return mk(e.date) === selMon;
      });
    if (hero) list = list.filter((e) => e.id !== hero.id);
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [events, selCats, selMon, hero]);

  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const ev of filtered) {
      // For ongoing events (start before 2026), group by start of range
      const k = ev.date < "2026-01-01" && ev.endDate && ev.endDate >= "2026-01-01"
        ? mk(ev.endDate < "2026-06-30" ? "2026-01-01" : ev.endDate)
        : mk(ev.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <>
      <div className="tsl-agenda-heading">
        <h1 className="tsl-agenda-title">
          Agenda de Eventos
          <br />
          <span className="red-bar"></span>
        </h1>
      </div>

      <div className="tsl-filters">
        <div className="tsl-filters-row">
          <div className="tsl-filter-group">
            <div className="tsl-filter-label">Categoria</div>
            <div className="tsl-pills">
              <button
                className={`tsl-pill ${selCats.size === 0 ? "active" : ""}`}
                onClick={() => setSelCats(new Set())}
              >
                Todas
              </button>
              {categories.filter(c => c !== 'Todos os Eventos').map((c) => (
                <button
                  key={c}
                  className={`tsl-pill ${selCats.has(c) ? "active" : ""}`}
                  onClick={() => {
                    setSelCats(prev => {
                      const next = new Set(prev);
                      if (next.has(c)) next.delete(c);
                      else next.add(c);
                      return next;
                    });
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="tsl-filter-group">
            <div className="tsl-filter-label">Mês</div>
            <div className="tsl-pills">
              <button
                className={`tsl-pill ${selMon === 'Todos os Meses' ? 'active' : ''}`}
                onClick={() => setSelMon('Todos os Meses')}
              >
                Todos
              </button>
              {months.filter(m => m !== 'Todos os Meses').map((m) => (
                <button
                  key={m}
                  className={`tsl-pill ${selMon === m ? 'active' : ''}`}
                  onClick={() => setSelMon(m)}
                >
                  {mkLabel(m)}
                </button>
              ))}
            </div>
          </div>
          <div className="tsl-view-toggle">
            <button
              className={`tsl-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              className={`tsl-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      <main className="tsl-main">
        {grouped.length === 0 && (
          <div className="tsl-empty">
            <p>Sem eventos encontrados</p>
          </div>
        )}
        {grouped.map(([mkey, evts]) => (
          <section key={mkey} className="tsl-month">
            <h2 className="tsl-month-title">{mkLabel(mkey)}</h2>
            <div className={viewMode === "grid" ? "tsl-grid" : "tsl-list"}>
              {evts.map((ev) =>
                viewMode === "grid" ? (
                  <Link
                    key={ev.id}
                    href={`/evento/${ev.id}`}
                    className="tsl-card"
                  >
                    <div className="tsl-card-img">
                      {ev.imageUrl ? (
                        <img src={ev.imageUrl} alt={ev.title} loading="lazy" />
                      ) : (
                        <div className="tsl-card-noimg" />
                      )}
                      <div className="tsl-card-img-over" />
                    </div>
                    <div className="tsl-card-body">
                      <span className="tsl-card-date">
                        {fmtRange(ev.date, ev.endDate)}
                      </span>
                      <span className="tsl-card-cat">
                        {ev.category.toLowerCase()}
                      </span>
                      <h3 className="tsl-card-title">{ev.title}</h3>
                      {ev.location &&
                        ev.location !== "Barreiro" &&
                        cleanLoc(ev.location) && (
                          <span className="tsl-card-loc">
                            {cleanLoc(ev.location)}
                          </span>
                        )}
                      <span className="tsl-card-more">Ver Mais →</span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    key={ev.id}
                    href={`/evento/${ev.id}`}
                    className="tsl-list-item"
                  >
                    {ev.imageUrl && (
                      <img
                        className="tsl-list-img"
                        src={ev.imageUrl}
                        alt={ev.title}
                        loading="lazy"
                      />
                    )}
                    <span className="tsl-list-date">
                      {fmtRange(ev.date, ev.endDate)}
                    </span>
                    <span className="tsl-list-title">{ev.title}</span>
                    <span className="tsl-list-cat">
                      {ev.category.toLowerCase()}
                    </span>
                    {ev.location && cleanLoc(ev.location) && (
                      <span className="tsl-list-loc">
                        {cleanLoc(ev.location)}
                      </span>
                    )}
                    <span className="tsl-list-arrow">→</span>
                  </Link>
                ),
              )}
            </div>
          </section>
        ))}
        {grouped.length > 2 && (
          <div className="tsl-backtop">
            <a onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Voltar ao topo da página
            </a>
          </div>
        )}
      </main>
    </>
  );
}
