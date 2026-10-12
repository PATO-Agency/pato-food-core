import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { vicafoodsContent } from "@pato-food/vicafoods";

const { fetch, createClient } = vi.hoisted(() => ({
  fetch: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@sanity/client", () => ({ createClient }));
vi.mock("next/cache", () => ({ unstable_cache: (read: unknown) => read }));
import { getSanitySiteContent } from "./sanity";

function publishedDemo() {
  const content = structuredClone(vicafoodsContent);
  content.business.displayName = "PATO QA";
  content.whatsappConversion.ctaLabel = "PATO consulta";
  for (const key of [
    "menuCategories",
    "menuItems",
    "galleryImages",
    "promotions",
    "faqs",
    "testimonials",
  ] as const) {
    for (const row of content[key]) {
      row.id = `pato-${row.id}`;
      row.contentStatus = "approved";
      row.approvedAt = "2026-10-12T12:00:00Z";
    }
  }
  for (const item of content.menuItems)
    item.categoryId = `pato-${item.categoryId}`;
  for (const singleton of [content.business, content.whatsappConversion]) {
    singleton.contentStatus = "approved";
    singleton.approvedAt = "2026-10-12T12:00:00Z";
  }
  for (const row of content.galleryImages) row.image.rightsConfirmed = true;
  for (const image of [
    content.business.logo,
    content.business.hero.image,
    ...content.menuItems.map((item) => item.image),
    ...content.promotions.map((promotion) => promotion.image),
  ]) {
    if (image) image.rightsConfirmed = true;
  }
  return content;
}

describe("Sanity preview isolation", () => {
  beforeEach(() => {
    fetch.mockReset();
    createClient.mockReset().mockReturnValue({ fetch });
    vi.stubEnv("SANITY_PROJECT_ID", "testproject");
    vi.stubEnv("SANITY_DATASET", "test");
    vi.stubEnv("SANITY_READ_TOKEN", "test-read-token-000000000000");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("uses published PATO singletons and removes originals from every synthetic collection", async () => {
    vi.stubEnv("PATO_PREVIEW_SCOPE", "synthetic");
    const published = publishedDemo();
    const preview = structuredClone(vicafoodsContent);
    for (const key of [
      "menuCategories",
      "menuItems",
      "galleryImages",
      "promotions",
      "faqs",
      "testimonials",
    ] as const) {
      // Existing Vicafoods documents must never survive, even when malformed.
      Object.assign(preview, {
        [key]: [...published[key], ...preview[key], { id: "random-original" }],
      });
    }
    preview.menuItems.push({
      ...published.menuItems[0]!,
      id: "drafts.pato-demo-2026-10-13-item",
      name: "Nuevo pato de prueba",
      categoryId: `drafts.${published.menuCategories[0]!.id}`,
    });
    fetch.mockResolvedValueOnce(preview).mockResolvedValueOnce(published);

    const result = await getSanitySiteContent({ preview: true });

    expect(result.business.displayName).toBe("PATO QA");
    expect(result.whatsappConversion.ctaLabel).toBe("PATO consulta");
    for (const key of [
      "menuCategories",
      "menuItems",
      "galleryImages",
      "promotions",
      "faqs",
      "testimonials",
    ] as const) {
      expect(result[key].every((row) => row.id.startsWith("pato-"))).toBe(true);
      expect(result[key].length).toBe(
        published[key].length + (key === "menuItems" ? 1 : 0),
      );
    }
    expect(result.menuItems.at(-1)).toMatchObject({
      id: "pato-demo-2026-10-13-item",
      categoryId: published.menuCategories[0]!.id,
    });
    expect(fetch.mock.calls[1]?.[2]).toMatchObject({
      perspective: "published",
      cache: "no-store",
    });
  });

  it("prefers an own draft over its published copy in either order", async () => {
    vi.stubEnv("PATO_PREVIEW_SCOPE", "synthetic");
    const published = publishedDemo();
    for (const draftFirst of [false, true]) {
      const preview = structuredClone(published);
      const item = published.menuItems[0]!;
      const draft = {
        ...item,
        id: `drafts.${item.id}`,
        name: "Editado en Studio",
      };
      preview.menuItems = draftFirst ? [draft, item] : [item, draft];
      fetch.mockResolvedValueOnce(preview).mockResolvedValueOnce(published);
      const result = await getSanitySiteContent({ preview: true });
      expect(result.menuItems).toHaveLength(1);
      expect(result.menuItems[0]).toMatchObject({
        id: item.id,
        name: "Editado en Studio",
      });
    }
  });

  it.each([undefined, "full", "unknown"])(
    "preserves full preview by default (%s)",
    async (scope) => {
      vi.stubEnv("PATO_PREVIEW_SCOPE", scope);
      fetch.mockResolvedValueOnce(vicafoodsContent);
      const result = await getSanitySiteContent({ preview: true });
      expect(result).toEqual(vicafoodsContent);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(createClient.mock.calls[0]?.[0]).toMatchObject({
        perspective: "drafts",
      });
    },
  );

  it("keeps published reads unchanged even when synthetic scope is configured", async () => {
    vi.stubEnv("PATO_PREVIEW_SCOPE", "synthetic");
    const published = publishedDemo();
    published.business.displayName = "Published content";
    fetch.mockResolvedValueOnce(published);
    expect(await getSanitySiteContent()).toEqual(published);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(createClient.mock.calls[0]?.[0]).toMatchObject({
      perspective: "published",
    });
  });

  it("sanitizes network errors from the extra published read", async () => {
    vi.stubEnv("PATO_PREVIEW_SCOPE", "synthetic");
    fetch
      .mockResolvedValueOnce(publishedDemo())
      .mockRejectedValueOnce(new Error("Authorization: secret"));
    await expect(getSanitySiteContent({ preview: true })).rejects.toThrow(
      "CMS content is temporarily unavailable",
    );
  });
});
