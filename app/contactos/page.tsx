import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contactos',
  description: 'Entre em contacto com a Agenda B. Sugira eventos, reporte erros ou proponha melhorias.',
  alternates: { canonical: '/contactos' },
};

export default function ContactosPage() {
  return (
    <div className="tsl-page">
      <h2 className="tsl-page-title">
        Contactos
        <br />
        <span className="red-bar"></span>
      </h2>
      <div className="tsl-page-content">
        <p>
          Tem um evento no Barreiro que não aparece na Agenda B? Encontrou algum erro na informação de um evento?
          Ou tem alguma sugestão para melhorar o projecto?
        </p>
        <p>
          Pode entrar em contacto através do email: <a href="mailto:agenda@barreiro.pt" className="tsl-link">agenda@barreiro.pt</a>
        </p>
        <p>
          Se organiza eventos no Barreiro e quer garantir que aparecem na Agenda B, a forma mais simples é publicá-los
          numa das fontes que a agenda utiliza, como o site da Câmara Municipal do Barreiro ou a Viral Agenda.
          Os eventos dessas plataformas são recolhidos automaticamente e adicionados à agenda.
        </p>
      </div>
    </div>
  );
}
