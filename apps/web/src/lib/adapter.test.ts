import { describe, expect, it } from "vitest";
import { vicafoodsContent, vicafoodsConfig } from "@pato-food/vicafoods";
import { adaptContent } from "./adapter";
import {
  isLocalDevelopmentPreview,
  safeRedirect,
  secretsMatch,
} from "./preview-security";
import { tagsForWebhook } from "./revalidation";
import { resolveContentPolicy } from "./content-policy";
import { readSanityConfiguration } from "./sanity-configuration";

describe("content boundary", () => {
  it("keeps the pilot contact disabled and renders latest observed burger price", () => {
    const content = adaptContent(vicafoodsContent, vicafoodsConfig);
    expect(content.conversion.href).toBeNull();
    expect(content.conversion.phone).toBeUndefined();
    expect(vicafoodsContent.whatsappConversion.destinationE164).toBe(
      "+51987384803",
    );
    expect(content.conversion.fallbackLabel).toBe(
      "Canal configurado · activación pendiente",
    );
    expect(content.demo).toBe(true);
    expect(content.items.find((i) => i.id === "hamb-angus")?.price).toContain(
      "29.50",
    );
    expect(
      content.items.find((i) => i.id === "market-pack-cerdo")?.description,
    ).toContain("4 × 150 g");
    expect(content.hours[6]).toEqual({
      label: "Domingo",
      value: "12:00–17:00",
    });
  });
  it("filters hidden categories and their items", () => {
    const fixture = structuredClone(vicafoodsContent);
    fixture.menuCategories[0]!.visible = false;
    fixture.menuItems[6]!.availability = "outOfStock";
    const content = adaptContent(fixture, vicafoodsConfig);
    expect(
      content.items.some((i) => i.categoryId === fixture.menuCategories[0]!.id),
    ).toBe(false);
    expect(
      content.items.find((i) => i.id === fixture.menuItems[6]!.id)?.unavailable,
    ).toBe(true);
  });
  it("exposes only currently active promotions and preserves CTA placements", () => {
    const fixture = structuredClone(vicafoodsContent);
    fixture.promotions.push(
      {
        contentStatus: "pendingValidation",
        sourceRef: "synthetic-test",
        id: "active-promo",
        title: "Promoción activa",
        text: "Contenido sintético",
        startsAt: "2026-09-18T00:00:00-05:00",
        endsAt: "2026-09-20T00:00:00-05:00",
        active: true,
        campaignId: "active-promo",
        useWhatsappCta: true,
      },
      {
        contentStatus: "pendingValidation",
        sourceRef: "synthetic-test",
        id: "expired-promo",
        title: "Promoción vencida",
        text: "Contenido sintético",
        startsAt: "2026-09-01T00:00:00-05:00",
        endsAt: "2026-09-02T00:00:00-05:00",
        active: true,
        campaignId: "expired-promo",
        useWhatsappCta: false,
      },
    );
    fixture.whatsappConversion.placements = ["hero", "promotion"];
    const content = adaptContent(
      fixture,
      vicafoodsConfig,
      new Date("2026-09-19T12:00:00-05:00"),
    );
    expect(content.promotions.map((promotion) => promotion.id)).toEqual([
      "active-promo",
    ]);
    expect(content.conversion.placements).toEqual(["hero", "promotion"]);
  });
});
describe("integration security boundaries", () => {
  it("keeps fixtures internal and blocks this prospect from public release", () => {
    expect(
      resolveContentPolicy({
        source: undefined,
        visibility: undefined,
        config: vicafoodsConfig,
      }),
    ).toEqual({ source: "fixture", visibility: "internal" });
    expect(() =>
      resolveContentPolicy({
        source: "sanity",
        visibility: "public",
        config: vicafoodsConfig,
      }),
    ).toThrow("blocked");
    expect(() =>
      resolveContentPolicy({
        source: "fixture",
        visibility: "public",
        config: { internalOnly: false, publishBlocked: false },
      }),
    ).toThrow("Fixture content");
    expect(
      resolveContentPolicy({
        source: "sanity",
        visibility: "public",
        config: { internalOnly: false, publishBlocked: false },
      }),
    ).toEqual({ source: "sanity", visibility: "public" });
  });
  it("requires explicit private-dataset credentials for CMS reads", () => {
    expect(() => readSanityConfiguration({})).toThrow("PROJECT_ID");
    expect(() =>
      readSanityConfiguration({
        SANITY_PROJECT_ID: "test-project",
        SANITY_DATASET: "development",
      }),
    ).toThrow("READ_TOKEN");
    expect(
      readSanityConfiguration({
        SANITY_PROJECT_ID: "test-project",
        SANITY_DATASET: "development",
        SANITY_READ_TOKEN: "x".repeat(32),
      }),
    ).toEqual({
      projectId: "test-project",
      dataset: "development",
      token: "x".repeat(32),
    });
  });
  it("fails closed without a configured strong preview secret", () => {
    expect(secretsMatch("short", "short")).toBe(false);
    expect(secretsMatch("a".repeat(32), undefined)).toBe(false);
    expect(secretsMatch("a".repeat(32), "b".repeat(32))).toBe(false);
    expect(secretsMatch("a".repeat(32), "a".repeat(32))).toBe(true);
  });
  it("allows secretless preview only on a loopback host in development", () => {
    expect(
      isLocalDevelopmentPreview(
        new URL("http://localhost:3000"),
        "development",
      ),
    ).toBe(true);
    expect(
      isLocalDevelopmentPreview(
        new URL("http://127.0.0.1:3000"),
        "development",
      ),
    ).toBe(true);
    expect(
      isLocalDevelopmentPreview(
        new URL("https://preview.example.com"),
        "development",
      ),
    ).toBe(false);
    expect(
      isLocalDevelopmentPreview(new URL("http://localhost:3000"), "production"),
    ).toBe(false);
  });
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/api/revalidate/sanity",
    "/?secret=leak",
  ])("rejects unsafe preview redirect %s", (value) => {
    expect(safeRedirect(value)).toBe("/");
  });
  it("revalidates only published supported content types", () => {
    expect(tagsForWebhook({ _type: "menuItem", _id: "item-one" })).toEqual([
      "menu",
    ]);
    expect(
      tagsForWebhook({ _type: "menuItem", _id: "drafts.item-one" }),
    ).toBeNull();
    expect(tagsForWebhook({ _type: "__proto__", _id: "unknown" })).toBeNull();
    expect(tagsForWebhook(null)).toBeNull();
  });
});
