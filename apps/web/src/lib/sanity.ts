import "server-only";
import { createClient } from "@sanity/client";
import { unstable_cache } from "next/cache";
import {
  assertProductionContent,
  parseSiteContent,
  previewSiteQuery,
  publishedSiteQuery,
  type SiteContent,
} from "@pato-food/content-contract";
import { readSanityConfiguration } from "./sanity-configuration";

const CACHE_TAGS = [
  "business",
  "menu",
  "gallery",
  "promotion",
  "faq",
  "testimonial",
];

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid CMS content response");
  return value as Record<string, unknown>;
}

function syntheticPreview(drafts: unknown, published: unknown): unknown {
  const content = { ...record(drafts) };
  const singletons = record(published);
  content.business = singletons.business;
  content.whatsappConversion = singletons.whatsappConversion;
  const publishedId = (id: string) => id.replace(/^drafts\./, "");
  for (const collection of [
    "menuCategories",
    "menuItems",
    "galleryImages",
    "promotions",
    "faqs",
    "testimonials",
  ]) {
    const rows = content[collection];
    if (!Array.isArray(rows)) continue; // Let the contract reject malformed collections.
    const own = new Map<string, Record<string, unknown>>();
    for (const value of rows) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const row = record(value);
      if (typeof row.id !== "string") continue;
      const id = publishedId(row.id);
      if (!id.startsWith("pato-")) continue;
      // The drafts perspective already overlays published documents. Handle raw
      // draft IDs defensively as well, retaining the draft regardless of order.
      if (!own.has(id) || row.id.startsWith("drafts.")) {
        own.set(id, {
          ...row,
          id,
          ...(collection === "menuItems" && typeof row.categoryId === "string"
            ? { categoryId: publishedId(row.categoryId) }
            : {}),
        });
      }
    }
    content[collection] = [...own.values()];
  }
  return content;
}

async function fetchSiteContent(preview: boolean): Promise<SiteContent> {
  const { projectId, dataset, token } = readSanityConfiguration(process.env);
  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2026-09-18",
    perspective: preview ? "drafts" : "published",
    useCdn: false,
    requestTagPrefix: "pato-food",
    token,
  });
  let result: unknown;
  try {
    result = await client.fetch(
      preview ? previewSiteQuery : publishedSiteQuery,
      {},
      preview ? { cache: "no-store", tag: "preview" } : { tag: "published" },
    );
    if (preview && process.env.PATO_PREVIEW_SCOPE === "synthetic") {
      const published = await client.fetch(
        publishedSiteQuery,
        {},
        {
          perspective: "published",
          cache: "no-store",
          tag: "preview-singletons",
        },
      );
      result = syntheticPreview(result, published);
    }
  } catch {
    // Sanity network errors can contain the complete request headers. Never let
    // the original error reach the framework logger because reads use a token.
    throw new Error("CMS content is temporarily unavailable");
  }
  const content = parseSiteContent(result);
  if (!preview) assertProductionContent(content);
  return content;
}

const fetchPublishedContent = unstable_cache(
  () => fetchSiteContent(false),
  [
    "pato-food-sanity-site-v1",
    process.env.SANITY_PROJECT_ID || "unconfigured-project",
    process.env.SANITY_DATASET || "unconfigured-dataset",
  ],
  { revalidate: 300, tags: CACHE_TAGS },
);

export function getSanitySiteContent({
  preview = false,
}: {
  preview?: boolean;
} = {}): Promise<SiteContent> {
  return preview ? fetchSiteContent(true) : fetchPublishedContent();
}
