import { legalDocuments } from "../../lib/legal-documents";

export default function LegalIndex() {
  return (
    <main id="legal-main" className="section-shell legal-index">
      <h1>Información legal</h1>
      <p className="legal-intro">
        Consulta los documentos de la versión actual: catálogo y contacto por
        WhatsApp. Los puntos que faltan por confirmar están identificados en
        cada texto.
      </p>
      <p className="legal-date">
        Preparados el 15 de octubre de 2026 · Fecha de entrada en vigor
        pendiente
      </p>
      <ul className="legal-document-list">
        {legalDocuments.map((document) => (
          <li key={document.slug}>
            <a href={`/legal/${document.slug}`}>
              <h2>{document.title}</h2>
              <p>{document.description}</p>
              <span>Leer borrador</span>
            </a>
          </li>
        ))}
      </ul>
      <section className="legal-open-items" aria-labelledby="legal-open-title">
        <h2 id="legal-open-title">Por confirmar</h2>
        <p>
          Identidad registral y domicilio vigentes, conservación de datos,
          proveedores y transferencias, atención de derechos y funcionamiento
          del Libro de Reclamaciones propio.
        </p>
        <p>
          El texto de atención y reclamaciones es informativo. El Libro de
          Reclamaciones aún no está integrado en esta demo.
        </p>
      </section>
    </main>
  );
}
