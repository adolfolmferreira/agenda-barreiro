export default function ContactosPage() {
  return (
    <div className="tsl-page">
      <h1 className="tsl-page-title">
        Contactos
        <br />
        <span className="red-bar"></span>
      </h1>
      <div className="tsl-page-content">
        <h1>
          Tem um evento no Barreiro que não aparece na <strong>Agenda B</strong>
          ? Encontrou algum erro na informação de um evento? Ou tem alguma
          sugestão para melhorar o projecto?
        </h1>
        <p>
          Pode entrar em contacto através do email:<br/>{" "}
          <a href="mailto:agenda@agendab.pt" title="agenda@agendab.pt" className="tsl-link">
            agenda@agendab.pt
          </a>
        </p>
        <p>
          Se organiza eventos no Barreiro e quer garantir que aparecem na <strong>Agenda B</strong>, a forma mais simples é publicá-los numa das fontes que a agenda
          utiliza, como o site da <strong>Câmara Municipal do Barreiro</strong> ou a <strong>Viral
          Agenda</strong>. Os eventos dessas plataformas são recolhidos automaticamente e
          adicionados à agenda.
        </p>
      </div>
    </div>
  );
}
