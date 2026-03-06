'use client';

export default function Footer({ lastUpdated }: { lastUpdated?: string | null }) {
  const year = new Date().getFullYear();

  return (
    <footer className="tsl-foot">
      <div className="tsl-foot-in">
        <div className="tsl-foot-left">
          <span>Made in Barreiro with ❤️</span>
          <span className="tsl-foot-sep">|</span>
          <a href="https://adolfoferreira.com" target="_blank" rel="noopener noreferrer" className="tsl-foot-link">adolfoferreira.com</a>
        </div>
        <div className="tsl-foot-center">
          <span>{year} © Agenda B — Dados de fontes públicas</span>
        </div>
        <div className="tsl-foot-right">
          <img src="/agenda-b-logotipo.svg" alt="Agenda Barreiro" className="tsl-foot-logo" />
        </div>
      </div>
    </footer>
  );
}
