export default function ContactosPage() {
  return (
    <div className="tsl-page">
      <h1 className="tsl-page-title">Contactos</h1>
      <div className="tsl-page-content">
        <p>
          Tem um evento no Barreiro que não aparece na nossa agenda? Encontrou algum erro nos dados? 
          Quer sugerir uma melhoria?
        </p>
        <p>
          Entre em contacto connosco através do email: <a href="mailto:agenda@barreiro.pt" className="tsl-link">agenda@barreiro.pt</a>
        </p>
        <p>
          Se é organizador de eventos no Barreiro e quer garantir que os seus eventos aparecem na agenda, 
          publique-os no site da Câmara Municipal do Barreiro ou na Viral Agenda — os nossos scrapers 
          recolhem automaticamente os dados dessas fontes.
        </p>
      </div>
    </div>
  );
}
