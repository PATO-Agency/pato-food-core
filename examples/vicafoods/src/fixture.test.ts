import { expect, it } from "vitest";
import {
  assertProductionContent,
  buildWhatsAppUrl,
  getHoursForDate,
  parseSiteContent,
  siteContentSchema,
} from "@pato-food/content-contract";
import { vicafoodsContent, vicafoodsConfig } from "./index";
it("validates the fixture and blocks production and live CTA", () => {
  expect(siteContentSchema.safeParse(vicafoodsContent).success).toBe(true);
  expect(
    vicafoodsConfig.publishBlocked &&
      vicafoodsConfig.internalOnly &&
      vicafoodsConfig.prospect,
  ).toBe(true);
  expect(buildWhatsAppUrl(vicafoodsContent.whatsappConversion)).toBeNull();
  expect(() => assertProductionContent(vicafoodsContent)).toThrow();
});
it("prioritizes S12/S13 for prepared food, preserves Market units", () => {
  expect(
    vicafoodsContent.menuItems.filter((i) =>
      ["S12", "S13"].includes(i.sourceRef),
    ),
  ).toHaveLength(14);
  expect(
    vicafoodsContent.menuItems.find((i) => i.id === "hamb-angus")
      ?.priceOptions[0]?.amount,
  ).toBe(29.5);
  expect(
    vicafoodsContent.menuItems.find((i) => i.id === "market-pack-cerdo")
      ?.priceOptions[0]?.netContent,
  ).toEqual({ quantity: 150, unit: "g", count: 4 });
});
it("resolves weekly hours in Lima and honors special closure", () => {
  expect(
    getHoursForDate(vicafoodsContent.business, new Date("2026-09-20T18:00:00Z"))
      .intervals[0],
  ).toEqual({ opens: "12:00", closes: "17:00" });
  const business = {
    ...vicafoodsContent.business,
    specialHours: [{ date: "2026-09-20", closed: true, intervals: [] }],
  };
  expect(
    getHoursForDate(business, new Date("2026-09-21T01:00:00Z")).closed,
  ).toBe(true);
});
it("normalizes CMS optional nulls and rejects broken references", () => {
  expect(
    parseSiteContent({
      ...vicafoodsContent,
      business: { ...vicafoodsContent.business, logo: null },
    }).business.logo,
  ).toBeUndefined();
  expect(
    siteContentSchema.safeParse({ ...vicafoodsContent, menuCategories: [] })
      .success,
  ).toBe(false);
});
