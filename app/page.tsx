import { getEvents } from './components/getEvents';
import HomeClient from './home-client';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Agenda B — Eventos e Cultura no Barreiro',
  description: 'Descubra o que se passa no Barreiro. Concertos, teatro, exposições, workshops, cinema e eventos para toda a família. Agenda actualizada diariamente.',
  alternates: { canonical: '/' },
};


const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Agenda B",
      "url": "https://agendab.pt",
      "logo": "https://agendab.pt/og-image.jpg",
      "description": "Agenda cultural independente do Barreiro, Portugal.",
      "areaServed": "Barreiro, Portugal",
      "email": "agenda@agendab.pt"
    },
    {
      "@type": "WebSite",
      "name": "Agenda B",
      "url": "https://agendab.pt",
      "description": "Agenda cultural e de eventos do Barreiro. Concertos, teatro, exposições, workshops, cinema e eventos para toda a família.",
      "inLanguage": "pt-PT",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://agendab.pt/agenda?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

export default async function Page() {
  const events = await getEvents();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <HomeClient events={events} />
    </>
  );
}
