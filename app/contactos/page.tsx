import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contactos',
  description: 'Entre em contacto com a Agenda B. Sugira novos eventos, reporte erros na informação ou proponha melhorias para a agenda cultural do Barreiro.',
  alternates: { canonical: '/contactos' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'Como posso submeter um evento para a Agenda B?',
      'acceptedAnswer': { '@type': 'Answer', 'text': 'A forma mais simples é publicar o evento numa das fontes que a Agenda B utiliza, como o site da Câmara Municipal do Barreiro ou a Viral Agenda. Os eventos dessas plataformas são recolhidos automaticamente. Em alternativa, pode entrar em contacto pelo email agenda@agendab.pt.' }
    },
    {
      '@type': 'Question',
      'name': 'Como reportar um erro na informação de um evento?',
      'acceptedAnswer': { '@type': 'Answer', 'text': 'Pode reportar erros ou sugerir melhorias através do email agenda@agendab.pt.' }
    }
  ]
};

export default function ContactosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="tsl-page">
      <h1 className="tsl-page-title">
        Contactos
        <br />
        <span className="red-bar"></span>
      </h1>
      <div className="tsl-page-content">
        <h2>
          Tem um evento no Barreiro que não aparece na <strong>Agenda B</strong>? Encontrou algum erro na informação de um evento?
          Ou tem alguma sugestão para melhorar o projecto?
        </h2>
        <p>
          Pode entrar em contacto através do email: <a href="mailto:agenda@agendab.pt" className="tsl-link">agenda@agendab.pt</a>
        </p>
        <p>
          Se organiza eventos no Barreiro e quer garantir que aparecem na <strong>Agenda B</strong>, a forma mais simples é publicá-los
          numa das fontes que a agenda utiliza, como o site da <strong>Câmara Municipal do Barreiro</strong> ou a <strong>Viral Agenda</strong>.
          Os eventos dessas plataformas são recolhidos automaticamente e adicionados à agenda.
        </p>
      </div>
    </div>
    </>
  );
}
