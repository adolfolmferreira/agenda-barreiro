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


  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selMons, setSelMons] = useState<Set<string>>(new Set());
  const [monsInitialized, setMonsInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = useMemo(() => {
    const s = new Set(events.map((e) => e.category).filter(Boolean));
    return ["Todos os Eventos", ...Array.from(s).sort()];
  }, [events]);

  const months = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) {
      if ((e.endDate || e.date) < "2026-01-01") continue;
      const start = e.date < "2026-01-01" ? "2026-01" : mk(e.date);
      const end = e.endDate ? mk(e.endDate) : start;
      let cur = start;
      while (cur <= end && cur <= "2026-12") {
        s.add(cur);
        const [y, m] = cur.split("-").map(Number);
        const next = m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`;
        cur = next;
      }
    }
    return ["Todos os Meses", ...Array.from(s).sort().reverse()];
  }, [events]);

  useEffect(() => {
    if (!monsInitialized && months.length > 1) {
      const futureMonths = months.filter(m => m !== 'Todos os Meses' && m >= currentMonth);
      setSelMons(new Set(futureMonths));
      setMonsInitialized(true);
    }
  }, [months, monsInitialized, currentMonth]);

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
    if (selMons.size > 0) {
      const allMonths = months.filter(m => m !== 'Todos os Meses');
      const allSelected = selMons.size === allMonths.length;
      if (!allSelected) {
        list = list.filter((e) => {
          const start = e.date < "2026-01-01" ? "2026-01" : mk(e.date);
          const end = e.endDate ? mk(e.endDate) : start;
          let cur = start;
          while (cur <= end && cur <= "2026-12") {
            if (selMons.has(cur)) return true;
            const [y, m] = cur.split("-").map(Number);
            cur = m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`;
          }
          return false;
        });
      }
    }
    if (hero) list = list.filter((e) => e.id !== hero.id);
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [events, selCats, selMons, months, hero]);

  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const ev of filtered) {
      const start = ev.date < "2026-01-01" ? "2026-01" : mk(ev.date);
      const end = ev.endDate ? mk(ev.endDate) : start;
      let cur = start;
      while (cur <= end && cur <= "2026-12") {
        if (!map.has(cur)) map.set(cur, []);
        map.get(cur)!.push(ev);
        const [y, m] = cur.split("-").map(Number);
        cur = m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`;
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
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
                className={`tsl-pill ${selMons.size === 0 || selMons.size === months.filter(m => m !== 'Todos os Meses').length ? 'active' : ''}`}
                onClick={() => {
                  const all = months.filter(m => m !== 'Todos os Meses');
                  setSelMons(new Set(all));
                }}
              >
                Todos
              </button>
              {months.filter(m => m !== 'Todos os Meses').map((m) => (
                <button
                  key={m}
                  className={`tsl-pill ${selMons.has(m) ? 'active' : ''}`}
                  onClick={() => {
                    setSelMons(prev => {
                      const next = new Set(prev);
                      if (next.has(m)) next.delete(m);
                      else next.add(m);
                      return next;
                    });
                  }}
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
                        <img src={ev.imageUrl} alt="" loading="lazy" />
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
                    <div className="tsl-list-thumb">
                      {ev.imageUrl ? (
                        <img src={ev.imageUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="tsl-list-nothumb" />
                      )}
                    </div>
                    <div className="tsl-list-info">
                      <span className="tsl-list-date">{fmtRange(ev.date, ev.endDate)}</span>
                      <span className="tsl-list-cat">{ev.category.toLowerCase()}</span>
                      <span className="tsl-list-title">{ev.title}</span>
                      {ev.location && cleanLoc(ev.location) && (
                        <span className="tsl-list-loc">{cleanLoc(ev.location)}</span>
                      )}
                    </div>
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
