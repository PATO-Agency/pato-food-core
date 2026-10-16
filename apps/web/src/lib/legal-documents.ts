export const legalDocuments = [
  {
    slug: "condiciones",
    file: "condiciones.md",
    label: "Condiciones de uso",
    title: "Aviso legal y condiciones de uso",
    description: "Identidad, catálogo y consultas por WhatsApp.",
  },
  {
    slug: "privacidad",
    file: "privacidad.md",
    label: "Privacidad",
    title: "Política de privacidad",
    description: "Datos de navegación, contacto y ejercicio de derechos.",
  },
  {
    slug: "cookies",
    file: "cookies.md",
    label: "Cookies",
    title: "Cookies y tecnologías similares",
    description: "Tecnologías comprobadas y límites de la revisión.",
  },
  {
    slug: "demostracion",
    file: "demostracion.md",
    label: "Aviso de demostración",
    title: "Aviso de demostración",
    description: "Contenido referencial y alcance de los enlaces de contacto.",
  },
  {
    slug: "reclamaciones",
    file: "reclamaciones.md",
    label: "Atención y reclamaciones",
    title: "Atención de consultas y reclamaciones",
    description: "Canales de contacto y pendientes del Libro de Reclamaciones.",
  },
] as const;

export function getLegalDocument(slug: string) {
  return legalDocuments.find((document) => document.slug === slug);
}

export const legalFooterLinks = [
  { href: "/legal", label: "Información legal" },
  ...legalDocuments.map((document) => ({
    href: `/legal/${document.slug}`,
    label: document.label,
  })),
];

/** Draft documents are approved for the isolated Vicafoods demo only. */
export function mayShowLegalDrafts({
  siteKey,
  internalOnly,
  publishBlocked,
  visibility,
  deploymentEnvironment,
}: {
  siteKey: string;
  internalOnly: boolean;
  publishBlocked: boolean;
  visibility?: string;
  deploymentEnvironment?: string;
}) {
  return (
    siteKey === "vicafoods-demo" &&
    internalOnly &&
    publishBlocked &&
    (visibility?.trim() || "internal") === "internal" &&
    deploymentEnvironment?.trim() !== "production"
  );
}
