'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const path = usePathname();

  return (
    <header className="tsl-head">
      <div className="tsl-head-in">
        <Link href="/" className="tsl-logo">
          <span className="tsl-logo-day">{new Date().getDate()}</span>
          <span className="tsl-logo-wordmark">Agenda<br/>Barreiro</span>
        </Link>
        <nav className="tsl-nav">
          <Link href="/" className={`tsl-nav-link ${path === '/' ? 'active' : ''}`}>Início</Link>
          <Link href="/agenda" className={`tsl-nav-link ${path.startsWith('/agenda') || path.startsWith('/evento') ? 'active' : ''}`}>Agenda</Link>
          <Link href="/sobre" className={`tsl-nav-link ${path === '/sobre' ? 'active' : ''}`}>Sobre</Link>
          <Link href="/contactos" className={`tsl-nav-link ${path === '/contactos' ? 'active' : ''}`}>Contactos</Link>
        </nav>
      </div>
    </header>
  );
}
