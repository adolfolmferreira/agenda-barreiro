import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'A Agenda B é um projecto independente que reúne num único lugar todos os eventos culturais, desportivos e comunitários que acontecem no Barreiro.',
  alternates: { canonical: '/sobre' },
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  'name': 'Adolfo Ferreira',
  'jobTitle': 'Product Designer',
  'url': 'https://adolfoferreira.com',
  'sameAs': ['https://adolfoferreira.com', 'https://github.com/adolfolmferreira'],
  'knowsAbout': ['Product Design', 'Web Development', 'Cultural Events', 'Barreiro']
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'O que é a Agenda B?',
      'acceptedAnswer': { '@type': 'Answer', 'text': 'A Agenda B é um projecto independente que reúne num único lugar eventos culturais, desportivos e comunitários que acontecem no Barreiro, Portugal.' }
    },
    {
      '@type': 'Question',
      'name': 'De onde vêm os eventos da Agenda B?',
      'acceptedAnswer': { '@type': 'Answer', 'text': 'Os eventos são recolhidos automaticamente a partir de fontes públicas, incluindo o site da Câmara Municipal do Barreiro, a Viral Agenda e a AML (Área Metropolitana de Lisboa), e são actualizados várias vezes por dia.' }
    },
    {
      '@type': 'Question',
      'name': 'A Agenda B tem afiliação oficial com a Câmara Municipal do Barreiro?',
      'acceptedAnswer': { '@type': 'Answer', 'text': 'Não. A Agenda B é um projecto pessoal e independente, sem qualquer afiliação oficial com a Câmara Municipal do Barreiro ou outras entidades.' }
    },
    {
      '@type': 'Question',
      'name': 'Quem criou a Agenda B?',
      'acceptedAnswer': { '@type': 'Answer', 'text': 'A Agenda B foi criada por Adolfo Ferreira, designer de produto, como uma iniciativa pessoal desenvolvida no tempo livre para dar mais visibilidade às iniciativas locais do Barreiro.' }
    }
  ]
};

export default function SobrePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="tsl-page">
      <h1 className="tsl-page-title">
        Sobre a Agenda B
        <br />
        <span className="red-bar"></span>
      </h1>
      <div className="tsl-page-content">
        <h2>
          A <strong>Agenda B</strong> é um pequeno projecto independente que reúne num único lugar eventos culturais,
          desportivos e comunitários que acontecem no Barreiro.
        </h2>
        <p>
          A ideia surgiu de um problema simples: muitas vezes há coisas a acontecer na cidade — concertos, exposições,
          workshops ou iniciativas de associações — mas a informação está espalhada por vários sites, páginas de Facebook
          e agendas diferentes. Muitas vezes só descobrimos os eventos tarde demais… ou nem chegamos a saber que aconteceram.
        </p>
        <p>
          A <strong>Agenda B</strong> tenta resolver esse problema juntando essa informação num único sítio, de forma simples e fácil de consultar.
        </p>
        <p>
          Os eventos são recolhidos automaticamente a partir de várias fontes públicas, incluindo o site da <strong>Câmara Municipal do Barreiro</strong> e a <strong>Viral Agenda</strong>, e são actualizados várias vezes por dia.
        </p>
        <p>
          O projecto foi criado por <strong>Adolfo Ferreira</strong>, designer de produto, como uma iniciativa pessoal
          desenvolvida no tempo livre. A ideia é simples: tornar mais fácil descobrir o que está a acontecer na cidade
          e dar mais visibilidade às iniciativas locais.
        </p>
        <p>
          Este projecto não tem qualquer afiliação oficial com a <strong>Câmara Municipal do Barreiro</strong> ou outras entidades.
        </p>
        <p>
          Se quiser saber mais sobre o meu trabalho pode visitar: <a href="https://adolfoferreira.com/" target="_blank" rel="noopener noreferrer" className="tsl-link">adolfoferreira.com</a>
        </p>
      </div>
    </div>
    </>
  );
}
