import { describe, expect, it } from "vitest";
import {
  buildWhatsAppUrl,
  buildProductWhatsAppUrl,
  whatsappConversionSchema,
  menuItemSchema,
  menuCategorySchema,
  openingHoursSchema,
  promotionSchema,
  isPromotionActive,
  previewSiteQuery,
  publishedSiteQuery,
  internalVicafoodsDemoSiteQuery,
} from "./index";
const metadata = { contentStatus: "demo", sourceRef: "synthetic test" };
const category = {
  ...metadata,
  id: "category",
  name: "Categoría",
  slug: "categoria",
  groupLabel: "Grupo",
  sortOrder: 0,
  visible: true,
};
it("accepts legacy categories and preserves only valid catalog sections", () => {
  expect(menuCategorySchema.parse(category).catalogSection).toBeUndefined();
  for (const catalogSection of ["menu", "market", "catering"]) {
    expect(
      menuCategorySchema.parse({ ...category, catalogSection }).catalogSection,
    ).toBe(catalogSection);
  }
  expect(
    menuCategorySchema.safeParse({ ...category, catalogSection: "kg" }).success,
  ).toBe(false);
});
it("projects catalog classification through every content perspective", () => {
  for (const query of [
    previewSiteQuery,
    publishedSiteQuery,
    internalVicafoodsDemoSiteQuery,
  ]) {
    expect(query).toContain("groupLabel, catalogSection, sortOrder");
  }
});
const whatsapp = {
  ...metadata,
  enabled: true,
  intent: "order",
  destinationE164: "+51912345678",
  ctaLabel: "Pedir",
  prefilledMessage: "Hola, café & pan?",
  placements: ["hero"],
  fallbackLabel: "Contacto",
};
describe("WhatsApp contract", () => {
  it("requires a confirmed destination only when enabled", () => {
    expect(
      whatsappConversionSchema.safeParse({
        ...whatsapp,
        destinationE164: undefined,
      }).success,
    ).toBe(false);
    expect(
      buildWhatsAppUrl(
        whatsappConversionSchema.parse({
          ...whatsapp,
          enabled: false,
          destinationE164: undefined,
        }),
      ),
    ).toBeNull();
    expect(
      buildWhatsAppUrl(
        whatsappConversionSchema.parse({ ...whatsapp, enabled: false }),
      ),
    ).toBeNull();
  });
  it("encodes messages and removes only the validated plus prefix", () => {
    expect(buildWhatsAppUrl(whatsappConversionSchema.parse(whatsapp))).toBe(
      "https://wa.me/51912345678?text=Hola%2C%20caf%C3%A9%20%26%20pan%3F",
    );
  });
});
describe("product WhatsApp inquiries", () => {
  const conversion = whatsappConversionSchema.parse(whatsapp);
  const item = menuItemSchema.parse({
    ...metadata,
    id: "pork-pack",
    slug: "pork-pack",
    name: "Hamburguesa de cerdo & hierbas + ají",
    categoryId: category.id,
    pricingMode: "fixed",
    priceOptions: [
      {
        label: "Pack de 4",
        amount: 25,
        currency: "PEN",
        billingUnit: "package",
        unitQuantity: 1,
        netContent: { count: 4, quantity: 150, unit: "g" },
      },
    ],
    featured: false,
    availability: "available",
    sortOrder: 0,
  });
  const group = menuCategorySchema.parse({
    ...category,
    catalogSection: "market",
  });
  const input = {
    conversion,
    item,
    category: group,
    businessName: "VICAFOODS",
  };
  it("encodes the exact product, pack content and section without quoting an unapproved price", () => {
    const link = new URL(buildProductWhatsAppUrl(input)!);
    expect(link.origin + link.pathname).toBe("https://wa.me/51912345678");
    const message = link.searchParams.get("text")!;
    expect(message).toContain(item.name);
    expect(message).toContain("Carnicería & Market (para preparar en casa)");
    expect(message).toContain("Presentación: Pack de 4 · 4 × 150 g.");
    expect(message).toContain("Unidad de venta: pack.");
    expect(message).toContain("¿Tienen disponibilidad?");
    expect(message).not.toMatch(/S\/|25\.00|confirmado/);
  });
  it("distinguishes prepared portions from raw cuts sold by kilo and follows CMS edits", () => {
    const prepared = new URL(
      buildProductWhatsAppUrl({
        ...input,
        category: { ...group, catalogSection: "menu" },
        item: {
          ...item,
          name: "Corte a la parrilla 500 g",
          priceOptions: [
            {
              ...item.priceOptions[0]!,
              label: "Porción de 500 g",
              billingUnit: "portion",
              netContent: undefined,
            },
          ],
        },
      })!,
    ).searchParams.get("text")!;
    expect(prepared).toContain(
      "Corte a la parrilla 500 g» de la carta de platos preparados",
    );
    expect(prepared).toContain("Unidad de venta: porción.");
    const raw = new URL(
      buildProductWhatsAppUrl({
        ...input,
        item: {
          ...item,
          name: "Picanha nacional",
          priceOptions: [
            {
              ...item.priceOptions[0]!,
              label: "Por kilogramo",
              billingUnit: "kg",
              netContent: undefined,
            },
          ],
        },
      })!,
    ).searchParams.get("text")!;
    expect(raw).toContain("Picanha nacional» de Carnicería & Market");
    expect(raw).toContain("Unidad de venta: kg.");
    expect(raw).not.toContain("Hamburguesa");
  });
  it("uses the sales unit instead of an internal generic presentation label", () => {
    const message = new URL(
      buildProductWhatsAppUrl({
        ...input,
        item: {
          ...item,
          priceOptions: [
            {
              ...item.priceOptions[0]!,
              label: "Presentación del catálogo",
              billingUnit: "portion",
              netContent: undefined,
            },
          ],
        },
      })!,
    ).searchParams.get("text")!;
    expect(message).toContain("Presentación: porción.");
    expect(message).not.toContain("Presentación del catálogo");
  });
  it("respects disabled contact, unavailable/hidden products and hidden or mismatched categories", () => {
    expect(
      buildProductWhatsAppUrl({
        ...input,
        conversion: { ...conversion, enabled: false },
      }),
    ).toBeNull();
    expect(
      buildProductWhatsAppUrl({
        ...input,
        conversion: { ...conversion, destinationE164: undefined },
      }),
    ).toBeNull();
    for (const availability of ["outOfStock", "hidden"] as const) {
      expect(
        buildProductWhatsAppUrl({ ...input, item: { ...item, availability } }),
      ).toBeNull();
    }
    expect(
      buildProductWhatsAppUrl({
        ...input,
        category: { ...group, visible: false },
      }),
    ).toBeNull();
    expect(
      buildProductWhatsAppUrl({
        ...input,
        category: { ...group, id: "other" },
      }),
    ).toBeNull();
    expect(
      buildProductWhatsAppUrl({
        ...input,
        category: { ...group, catalogSection: "catering" },
      }),
    ).toBeNull();
  });
});
it("uses separate draft and approved projections with safe category references", () => {
  expect(publishedSiteQuery).toContain('contentStatus == "approved"');
  expect(publishedSiteQuery).toContain('category->contentStatus == "approved"');
  expect(previewSiteQuery).toContain('"drafts.business"');
  expect(previewSiteQuery).not.toContain(
    'category->contentStatus == "approved"',
  );
  expect(previewSiteQuery).toContain("priceOptions[]{");
  expect(previewSiteQuery).toContain(
    '"image": select(defined(image.asset) => image{',
  );
});
it("rejects overlapping and reversed intervals", () => {
  expect(
    openingHoursSchema.safeParse({
      day: 1,
      closed: false,
      intervals: [
        { opens: "13:00", closes: "18:00" },
        { opens: "17:00", closes: "22:00" },
      ],
    }).success,
  ).toBe(false);
  expect(
    openingHoursSchema.safeParse({
      day: 1,
      closed: false,
      intervals: [{ opens: "22:00", closes: "13:00" }],
    }).success,
  ).toBe(false);
});
it("never allows a consultation price or free fixed price", () => {
  const item = {
    ...metadata,
    id: "test",
    name: "Test food",
    slug: "test",
    categoryId: "category",
    pricingMode: "onRequest",
    priceOptions: [],
    featured: false,
    availability: "available",
    sortOrder: 0,
  };
  expect(menuItemSchema.safeParse(item).success).toBe(true);
  const price = {
    label: "Each",
    amount: 0,
    currency: "PEN",
    billingUnit: "unit",
    unitQuantity: 1,
  };
  expect(
    menuItemSchema.safeParse({
      ...item,
      pricingMode: "fixed",
      priceOptions: [price],
    }).success,
  ).toBe(false);
  expect(
    menuItemSchema.safeParse({
      ...item,
      priceOptions: [{ ...price, amount: 5 }],
    }).success,
  ).toBe(false);
});
it("expires promotions at the end instant", () => {
  const promo = promotionSchema.parse({
    ...metadata,
    id: "promo",
    title: "Offer",
    text: "Offer details",
    startsAt: "2026-09-01T00:00:00-05:00",
    endsAt: "2026-09-02T00:00:00-05:00",
    active: true,
    campaignId: "test",
    useWhatsappCta: true,
  });
  expect(isPromotionActive(promo, new Date("2026-09-02T04:59:59Z"))).toBe(true);
  expect(isPromotionActive(promo, new Date("2026-09-02T05:00:00Z"))).toBe(
    false,
  );
});
