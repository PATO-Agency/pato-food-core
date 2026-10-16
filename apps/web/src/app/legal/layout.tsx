import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { getSiteConfiguration } from "../../lib/content";
import "./legal.css";

export const metadata: Metadata = {
  title: "Información legal · Vicafoods · Borrador",
  robots: { index: false, follow: false, nocache: true },
};

export default function LegalLayout({ children }: { children: ReactNode }) {
  const config = getSiteConfiguration();
  if (!config.legalPreviewEnabled) notFound();
  const theme = {
    "--accent": config.theme.primary,
    "--paper": config.theme.background,
    "--ink": config.theme.foreground,
  } as CSSProperties;
  return (
    <div className="food-site legal-site" style={theme}>
      <a className="skip-link" href="#legal-main">
        Saltar al documento
      </a>
      <header className="legal-header section-shell">
        <a href="/" className="wordmark" aria-label="Vicafoods, inicio">
          VICAFOODS<span>Meat & Market</span>
        </a>
        <a href="/#carta" className="legal-return">
          Volver al catálogo
        </a>
      </header>
      <div
        className="section-shell legal-status"
        aria-label="Estado de los documentos"
      >
        <strong>Borradores en revisión</strong>
        <p>
          Datos y procedimientos pendientes de confirmación. Esta integración
          permite revisar los textos en la demo; no acredita aprobación legal ni
          publicación comercial.
        </p>
      </div>
      {children}
      <footer className="section-shell legal-page-footer">
        <a href="/legal">Todos los documentos</a>
        <p>Vicafoods · Demo de revisión</p>
        <a href="/#carta">Volver al catálogo</a>
      </footer>
    </div>
  );
}
