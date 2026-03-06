'use client';

export default function Footer({ lastUpdated }: { lastUpdated?: string | null }) {
  return (
    <footer className="tsl-foot">
      <div className="tsl-foot-in">
        <span className="tsl-foot-brand">Agenda Barreiro</span>
        <span>Fabricado no Barreiro</span>
        {lastUpdated && <span>Última actualização: {new Date(lastUpdated).toLocaleDateString('pt-PT')}</span>}
      </div>
    </footer>
  );
}
