import { describe, expect, it } from "vitest";
import type { SiteContent } from "@pato-food/content-contract";
import { vicafoodsContent } from "@pato-food/vicafoods";
import type { SiteConfiguration } from "./adapter";
import {
  buildMetadata,
  buildRobots,
  buildSitemap,
  buildStructuredData,
  serializeStructuredData,
} from "./seo";

const internalConfig: SiteConfiguration = {
  siteKey: "pilot-internal",
  locale: "es-PE",
  internalOnly: true,
  publishBlocked: true,
  theme: { primary: "#d6ae51" },
};

const publicConfig: SiteConfiguration = {
  siteKey: "approved-public-site",
  locale: "es-PE",
  internalOnly: false,
  publishBlocked: false,
  publicUrl: "https://food.example",
  theme: { primary: "#d6ae51" },
};

function approvedContent(): SiteContent {
  const content = structuredClone(vicafoodsContent);
  const approvedAt = "2026-09-19T12:00:00Z";
  const documents = [
    content.business,
    content.whatsappConversion,
    ...content.menuCategories,
    ...content.menuItems,
    ...content.galleryImages,
    ...content.promotions,
    ...content.faqs,
    ...content.testimonials,
  ];
  for (const document of documents) {
    document.contentStatus = "approved";
    document.approvedAt = approvedAt;
  }
  const images = [
    content.business.logo,
    content.business.hero.image,
    ...content.menuItems.map((item) => item.image),
    ...content.galleryImages.map((item) => item.image),
    ...content.promotions.map((item) => item.image),
  ];
  for (const image of images) if (image) image.rightsConfirmed = true;
  return content;
}

describe("SEO release policy", () => {
  it("keeps internal pilot metadata generic and non-indexable", () => {
    const metadata = buildMetadata({
      policy: { visibility: "internal" },
      config: internalConfig,
      content: vicafoodsContent,
    });

    expect(metadata.title).toBe("PATO Food · Demostración interna");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph).toBeUndefined();
    expect(JSON.stringify(metadata)).not.toContain("VICAFOODS");
    expect(
      buildStructuredData({
        policy: { visibility: "internal" },
        config: internalConfig,
        content: vicafoodsContent,
      }),
    ).toBeNull();
  });

  it("keeps preview metadata private even under a public policy", () => {
    const metadata = buildMetadata({
      policy: { visibility: "public" },
      config: publicConfig,
      content: approvedContent(),
      preview: true,
    });

    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(JSON.stringify(metadata)).not.toContain("VICAFOODS");
  });

  it("emits approved public metadata and structured data", () => {
    const content = approvedContent();
    const metadata = buildMetadata({
      policy: { visibility: "public" },
      config: publicConfig,
      content,
    });
    const data = buildStructuredData({
      policy: { visibility: "public" },
      config: publicConfig,
      content,
    });

    expect(metadata.title).toBe("VICAFOODS");
    expect(metadata.alternates).toEqual({
      canonical: "https://food.example/",
    });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(data).toMatchObject({
      "@type": "FoodEstablishment",
      name: "VICAFOODS",
      url: "https://food.example/",
      address: {
        streetAddress: "Jr. Grau 369",
        addressLocality: "Magdalena del Mar",
        addressRegion: "Lima",
        addressCountry: "PE",
        postalCode: "15086",
      },
      sameAs: ["https://www.instagram.com/vicafoods.pe"],
    });
    expect(data?.openingHoursSpecification).toHaveLength(7);
    expect(data).not.toHaveProperty("aggregateRating");
    expect(data).not.toHaveProperty("review");
    expect(data).not.toHaveProperty("geo");
    expect(data).not.toHaveProperty("proofPoints");
  });

  it("fails closed when public configuration lacks an HTTPS URL", () => {
    const content = approvedContent();
    expect(() =>
      buildMetadata({
        policy: { visibility: "public" },
        config: { ...publicConfig, publicUrl: undefined },
        content,
      }),
    ).toThrow("explicit HTTPS public URL");
    expect(() =>
      buildMetadata({
        policy: { visibility: "public" },
        config: { ...publicConfig, publicUrl: "http://food.example" },
        content,
      }),
    ).toThrow("explicit HTTPS public URL");
  });

  it("switches robots and sitemap only for an approved public mode", () => {
    expect(
      buildRobots({
        policy: { visibility: "internal" },
        config: internalConfig,
      }),
    ).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(
      buildSitemap({
        policy: { visibility: "internal" },
        config: internalConfig,
      }),
    ).toEqual([]);
    expect(
      buildRobots({
        policy: { visibility: "public" },
        config: publicConfig,
      }),
    ).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://food.example/sitemap.xml",
    });
    expect(
      buildSitemap({
        policy: { visibility: "public" },
        config: publicConfig,
      }),
    ).toEqual([
      {
        url: "https://food.example/",
        changeFrequency: "weekly",
        priority: 1,
      },
    ]);
  });

  it("escapes markup inside JSON-LD", () => {
    const data = buildStructuredData({
      policy: { visibility: "public" },
      config: publicConfig,
      content: approvedContent(),
    });
    expect(data).not.toBeNull();
    if (!data) return;
    data.description = "</script><script>alert(1)</script>";
    const serialized = serializeStructuredData(data);
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
  });
});
