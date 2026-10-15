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
  it("gives catering its own section and inquiry while dish orders remain disabled", () => {
    const configured = structuredClone(content);
    configured.categories.push({
      id: "events",
      name: "Catering parrillero",
      section: "catering",
    });
    configured.lines.push("Catering parrillero");
    configured.items.push({
      id: "event-service",
      name: "Catering parrillero",
      categoryId: "events",
      price: "Consultar",
      featured: true,
      unavailable: false,
    });
    configured.conversion.cateringHref =
      "https://wa.me/51999999999?text=Consulta%20catering";
    const html = renderToStaticMarkup(<FoodLanding content={configured} />);
    const carta = html.slice(
      html.indexOf('id="carta"'),
      html.indexOf('id="catering"'),
    );
    expect(carta).not.toContain("Catering parrillero");
    expect(html).toContain('href="#catering"');
    expect(html).toContain("Los buenos momentos se comparten.");
    expect(html).toContain(
      'href="https://wa.me/51999999999?text=Consulta%20catering"',
    );
    expect(html).toContain("Consultar catering por WhatsApp");
    expect((html.match(/href="https:\/\/wa.me\//g) ?? []).length).toBe(1);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("separates butcher products from prepared dishes using CMS classification", () => {
    const configured = structuredClone(content);
    configured.categories.push({
      id: "raw-cuts",
      name: "Cortes de res",
      section: "market",
    });
    configured.items.push({
      id: "tomahawk",
      categoryId: "raw-cuts",
      name: "Tomahawk",
      price: "S/ 99 / kg",
      featured: true,
      unavailable: false,
      image: {
        src: "/tomahawk.jpg",
        alt: "Imagen referencial: tomahawk crudo",
      },
    });
    const html = renderToStaticMarkup(<FoodLanding content={configured} />);
    const carta = html.slice(
      html.indexOf('id="carta"'),
      html.indexOf('id="market"'),
    );
    const market = html.slice(
      html.indexOf('id="market"'),
      html.indexOf('id="experiencia"'),
    );
    expect(html).toContain('href="#market"');
    expect(carta).toContain("Bowl del día");
    expect(carta).not.toContain("Tomahawk");
    expect(market).toContain("Carnicería &amp; Market");
    expect(market).toContain("Tomahawk");
    expect(market).toContain("S/ 99 / kg");
    expect(market).toContain('alt="Imagen referencial: tomahawk crudo"');
    const featured = html.slice(
      html.indexOf('id="destacados"'),
      html.indexOf('id="carta"'),
    );
    expect(featured).not.toContain("Tomahawk");
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
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
