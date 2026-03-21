import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'A Agenda B é um projecto independente que reúne todos os eventos culturais, desportivos e comunitários do Barreiro.',
  alternates: { canonical: '/sobre' },
};

export default function SobrePage() {
  return (
    <div className="tsl-page">
      <h1 className="tsl-page-title">Sobre</h1>
      <div className="tsl-page-content">
        <p>
          A <strong>Agenda B</strong> é um projecto independente que reúne num único lugar todos os eventos culturais,
          desportivos e comunitários que acontecem no Barreiro.
        </p>
        <p>
          Os dados são recolhidos automaticamente a partir de fontes públicas, incluindo o site da
          Câmara Municipal do Barreiro, a Viral Agenda e a AML, e actualizados várias vezes por dia.
        </p>
        <p>
          Este projecto não tem qualquer afiliação oficial com a Câmara Municipal do Barreiro ou outras entidades.
          É um esforço comunitário para facilitar o acesso à informação sobre o que se passa na cidade.
        </p>
      </div>
    </div>
  );
}
