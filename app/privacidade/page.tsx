import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade e cookies da Agenda B. Saiba como utilizamos cookies, que dados recolhemos e quais são os seus direitos ao abrigo do RGPD.',
  alternates: { canonical: '/privacidade' },
};

export default function PrivacidadePage() {
  return (
    <div className="tsl-page">
      <h2 className="tsl-page-title">
        Política de Privacidade e Cookies
        <br />
        <span className="red-bar"></span>
      </h2>
      <div className="tsl-page-content">
        <h3>Responsável pelo tratamento</h3>
        <p>
          A Agenda B é um projecto independente, sem fins lucrativos, criado por Adolfo Ferreira.
          Para questões relacionadas com privacidade, pode contactar-nos através do email: <a href="mailto:agenda@agendab.pt" className="tsl-link">agenda@agendab.pt</a>
        </p>

        <h3>Dados pessoais</h3>
        <p>
          A Agenda B não recolhe, armazena ou processa dados pessoais dos seus utilizadores.
          Não existem formulários de registo, áreas de login ou funcionalidades que requeiram a introdução de dados pessoais.
        </p>

        <h3>Cookies</h3>
        <p>
          A Agenda B utiliza os seguintes tipos de cookies:
        </p>

        <h4>Cookies essenciais</h4>
        <p>
          <strong>cookie_consent</strong> — Armazena a sua escolha sobre cookies analíticos. Duração: 180 dias. Este cookie é estritamente necessário e não requer consentimento.
        </p>

        <h4>Cookies analíticos (requerem consentimento)</h4>
        <p>
          <strong>_ga</strong> e <strong>_ga_QECRTJC5LH</strong> — Cookies do Google Analytics utilizados para fins de análise de tráfego anónima.
          Permitem-nos compreender como os visitantes utilizam o site.
          Duração: 180 dias. Estes cookies só são activados após o consentimento do utilizador.
        </p>

        <h3>Como gerir os cookies</h3>
        <p>
          Quando visita o site pela primeira vez, é apresentado um banner que lhe permite aceitar ou rejeitar cookies analíticos.
          Pode alterar a sua escolha a qualquer momento limpando os cookies do seu browser e revisitando o site.
        </p>

        <h3>Partilha de dados</h3>
        <p>
          Não partilhamos quaisquer dados com terceiros, excepto os dados anónimos de tráfego enviados ao Google Analytics
          (apenas se o utilizador tiver dado consentimento).
        </p>

        <h3>Direitos do utilizador</h3>
        <p>
          Ao abrigo do RGPD, tem o direito de aceder, rectificar ou apagar os seus dados pessoais.
          Como não recolhemos dados pessoais, estes direitos aplicam-se apenas aos cookies analíticos,
          que pode recusar ou eliminar a qualquer momento.
        </p>

        <h3>Alterações a esta política</h3>
        <p>
          Esta política pode ser actualizada pontualmente. A última actualização foi em Março de 2026.
        </p>
      </div>
    </div>
  );
}
