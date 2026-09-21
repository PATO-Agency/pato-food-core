export type ContentSource = "fixture" | "sanity";
export type SiteVisibility = "internal" | "public";

export function resolveContentPolicy({
  source,
  visibility,
  config,
}: {
  source: string | undefined;
  visibility: string | undefined;
  config: { internalOnly: boolean; publishBlocked: boolean };
}): { source: ContentSource; visibility: SiteVisibility } {
  const resolvedSource = source?.trim() || "fixture";
  const resolvedVisibility = visibility?.trim() || "internal";
  if (resolvedSource !== "fixture" && resolvedSource !== "sanity")
    throw new Error(`Unsupported PATO_CONTENT_SOURCE: ${resolvedSource}`);
  if (resolvedVisibility !== "internal" && resolvedVisibility !== "public")
    throw new Error(`Unsupported PATO_SITE_VISIBILITY: ${resolvedVisibility}`);
  if (
    resolvedVisibility === "public" &&
    (config.internalOnly || config.publishBlocked)
  )
    throw new Error("Public release blocked by the client configuration");
  if (resolvedVisibility === "public" && resolvedSource === "fixture")
    throw new Error("Fixture content cannot be used for a public release");
  return { source: resolvedSource, visibility: resolvedVisibility };
}

/**
 * Local internal development is itself a protected preview surface: the proxy
 * only serves loopback hosts. Read drafts there without requiring every browser
 * profile to share Next.js' Draft Mode cookie.
 */
export function shouldReadDraftContent({
  draftModeEnabled,
  source,
  visibility,
  runtimeEnvironment,
}: {
  draftModeEnabled: boolean;
  source: string | undefined;
  visibility: string | undefined;
  runtimeEnvironment: string | undefined;
}): boolean {
  const usesSanity = source?.trim() === "sanity";
  const isInternal = (visibility?.trim() || "internal") === "internal";
  if (!usesSanity || !isInternal) return false;
  if (draftModeEnabled) return true;
  return runtimeEnvironment === "development" && usesSanity && isInternal;
}
