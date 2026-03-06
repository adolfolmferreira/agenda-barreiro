import "./globals.css";
import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { promises as fs } from 'fs';
import path from 'path';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Agenda Barreiro — Eventos e Cultura na Cidade",
  description: "O que se passa no Barreiro. Agenda independente de eventos, cultura e comunidade.",
};

async function getLastUpdated(): Promise<string | null> {
  try {
    const stat = await fs.stat(path.join(process.cwd(), 'data', 'events.json'));
    return stat.mtime.toISOString();
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lastUpdated = await getLastUpdated();
  return (
    <html lang="pt">
      <body>
        <div className="tsl">
          <Header />
          {children}
          <Footer lastUpdated={lastUpdated} />
        </div>
      </body>
    </html>
  );
}
