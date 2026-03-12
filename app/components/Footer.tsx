'use client';

export default function Footer({ lastUpdated }: { lastUpdated?: string | null }) {
  const year = new Date().getFullYear();

  return (
    <footer className="tsl-foot">
      <div className="tsl-foot-in">
        <div className="tsl-foot-left">
          <span>Feito no Barreiro para o Barreiro ❤️</span>
          <span className="tsl-foot-sep">|</span>
          <span>Design by:</span>
          <a href="https://adolfoferreira.com" target="_blank" rel="noopener noreferrer" className="tsl-foot-link">www.adolfoferreira.com</a>
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
