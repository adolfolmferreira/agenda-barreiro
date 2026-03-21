import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { promises as fs } from 'fs';
import path from 'path';

export const revalidate = 3600;

const SITE_URL = 'https://agendab.pt';
const SITE_NAME = 'Agenda B — Barreiro';
const SITE_DESC = 'Agenda cultural e de eventos do Barreiro. Concertos, teatro, exposições, workshops e muito mais na cidade do Barreiro.';

export const metadata: Metadata = {
  title: {
    default: 'Agenda B — Eventos e Cultura no Barreiro',
    template: '%s | Agenda B',
  },
  description: SITE_DESC,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Agenda B — Eventos e Cultura no Barreiro',
    description: SITE_DESC,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agenda B — Eventos e Cultura no Barreiro',
    description: SITE_DESC,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-QECRTJC5LH" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-QECRTJC5LH');`}
        </Script>
      </head>
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
