import { describe, expect, it } from "vitest";
import {
  buildWhatsAppUrl,
  whatsappConversionSchema,
  menuItemSchema,
  openingHoursSchema,
  promotionSchema,
  isPromotionActive,
  previewSiteQuery,
  publishedSiteQuery,
} from "./index";
const metadata = { contentStatus: "demo", sourceRef: "synthetic test" };
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
