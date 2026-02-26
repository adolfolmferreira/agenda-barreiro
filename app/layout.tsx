import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda Barreiro — Eventos e Cultura na Cidade",
  description: "O que se passa no Barreiro. Agenda independente de eventos, cultura e comunidade.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}