import "server-only";
import { vicafoodsContent, vicafoodsConfig } from "@pato-food/vicafoods";
import { adaptContent, type SiteConfiguration } from "./adapter";
import { resolveContentPolicy } from "./content-policy";
import { getSanitySiteContent } from "./sanity";

export function resolveRuntimeContentPolicy() {
  return resolveContentPolicy({
    source: process.env.PATO_CONTENT_SOURCE,
    visibility: process.env.PATO_SITE_VISIBILITY,
    config: vicafoodsConfig,
  });
}

export function getSiteConfiguration(): SiteConfiguration {
  const configuredPublicUrl = process.env.PATO_SITE_URL?.trim();
  return {
    ...vicafoodsConfig,
    publicUrl: configuredPublicUrl || undefined,
  };
}

export async function getSiteContent({ preview = false } = {}) {
  const policy = resolveRuntimeContentPolicy();
  const content =
    policy.source === "fixture"
      ? vicafoodsContent
      : await getSanitySiteContent({ preview });

  return {
    content,
    policy,
    config: getSiteConfiguration(),
  };
}

export async function getLandingContent({ preview = false } = {}) {
  const { content, config } = await getSiteContent({ preview });
  return adaptContent(content, config);
}
