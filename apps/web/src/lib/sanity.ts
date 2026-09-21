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
