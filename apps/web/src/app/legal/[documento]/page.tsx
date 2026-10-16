import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalMarkdown } from "../legal-markdown";
import { getLegalDocument, legalDocuments } from "../../../lib/legal-documents";
import { readLegalDocument } from "../../../lib/legal-files";

export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocuments.map((document) => ({ documento: document.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ documento: string }>;
}): Promise<Metadata> {
  const document = getLegalDocument((await params).documento);
  return {
    title: document
      ? `${document.title} · Vicafoods · Borrador`
      : "Documento no encontrado",
  };
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ documento: string }>;
}) {
  const document = await readLegalDocument((await params).documento);
  if (!document) notFound();
  return (
    <div className="section-shell legal-reading-layout">
      <nav className="legal-document-nav" aria-label="Documentos legales">
        <a href="/legal" className="legal-index-link">
          Información legal
        </a>
        {legalDocuments.map((item) => (
          <a
            key={item.slug}
            href={`/legal/${item.slug}`}
            aria-current={item.slug === document.slug ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <main id="legal-main" className="legal-document">
        <h1>{document.title}</h1>
        <div className="legal-prose">
          <LegalMarkdown>{document.markdown}</LegalMarkdown>
        </div>
      </main>
    </div>
  );
}
