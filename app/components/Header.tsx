'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="tsl-head">
      <div className="tsl-head-in">
        <Link href="/" className="tsl-logo" onClick={closeMenu}>
          <img src="/agenda-b-logotipo.svg" alt="Agenda Barreiro" className="tsl-logo-img" />
        </Link>
        <button className={`tsl-menu-toggle ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
          <span /><span /><span />
        </button>
        <nav className={`tsl-nav ${menuOpen ? 'open' : ''}`}>
          <Link href="/" className={`tsl-nav-link ${path === '/' ? 'active' : ''}`} onClick={closeMenu}>Início</Link>
          <Link href="/agenda" className={`tsl-nav-link ${path.startsWith('/agenda') || path.startsWith('/evento') ? 'active' : ''}`} onClick={closeMenu}>Agenda</Link>
          <Link href="/sobre" className={`tsl-nav-link ${path === '/sobre' ? 'active' : ''}`} onClick={closeMenu}>Sobre</Link>
          <Link href="/contactos" className={`tsl-nav-link ${path === '/contactos' ? 'active' : ''}`} onClick={closeMenu}>Contactos</Link>
        </nav>
      </div>
    </header>
  );
}
