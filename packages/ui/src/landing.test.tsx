import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FoodLanding } from "./index";
import type { LandingContent } from "./model";

const content: LandingContent = {
  siteKey: "garden-demo",
  demo: true,
  name: "Jardín de prueba",
  tagline: "Mesa de temporada",
  description: "Una identidad sintética para comprobar la reutilización.",
  hero: {
    eyebrow: "Cocina de estación",
    title: "Una mesa que cambia contigo.",
    text: "Texto de prueba.",
  },
  lines: ["Almuerzos", "Despensa"],
  categories: [{ id: "bowls", name: "Bowls", group: "Almuerzos" }],
  items: [
    {
      id: "bowl",
      categoryId: "bowls",
      name: "Bowl del día",
      price: "S/ 20.00 / porción",
      featured: true,
      unavailable: true,
    },
  ],
  gallery: [],
  promotions: [],
  faqs: [
    {
      id: "hours",
      question: "¿Cuándo abren?",
      answer: "Consulta el horario visible.",
    },
  ],
  address: "Dirección sintética",
  hours: [{ label: "Lunes", value: "Cerrado" }],
  timezone: "America/Lima",
  specialHours: [],
  socials: [],
  conversion: {
    href: null,
    label: "Consultar",
    fallbackLabel: "Contacto pendiente",
    intent: "inquiry",
    placements: ["hero", "navigation", "menu", "promotion", "footer"],
  },
};
describe("generic landing", () => {
  it("renders a second identity and usable native disclosures with no client-specific branches", () => {
    const html = renderToStaticMarkup(<FoodLanding content={content} />);
    expect(html).toContain("Jardín de prueba");
    expect(html).toContain("<details>");
    expect(html).toContain("Agotado");
    expect(html).toContain("Saltar al contenido");
    expect(html).toContain('href="#category-bowls"');
    expect(html).toContain("Fotografía pendiente de aprobación");
    expect(html).not.toContain("wa.me");
    expect(html).not.toContain("iframe");
  });
  it("renders only configured CTA placements and active promotion data supplied by the adapter", () => {
    const configured = structuredClone(content);
    configured.conversion.placements = ["hero", "promotion"];
    configured.promotions = [
      {
        id: "lunch-promo",
        title: "Promoción sintética",
        text: "Solo para comprobar el bloque configurable.",
        campaignId: "lunch-promo",
        useWhatsappCta: true,
      },
    ];
    configured.gallery = [
      { src: "/one.jpg", alt: "Primera imagen" },
      { src: "/two.jpg", alt: "Segunda imagen" },
    ];
    configured.faqs = [];
    const html = renderToStaticMarkup(<FoodLanding content={configured} />);
    expect(html).toContain("Promoción sintética");
    expect(html).toContain("gallery-count-2");
    expect(html).not.toContain("ANTES DE VISITARNOS");
    expect(html).not.toContain('class="header-cta"');
    expect((html.match(/conversion-pending/g) ?? []).length).toBe(2);
  });
  it("can identify an automatic internal preview without offering a no-op exit", () => {
    const html = renderToStaticMarkup(
      <FoodLanding content={content} preview previewExitAvailable={false} />,
    );
    expect(html).toContain("Vista previa editorial");
    expect(html).not.toContain("Salir de vista previa");
  });
});
