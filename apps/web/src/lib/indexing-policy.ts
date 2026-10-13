import { httpsUrlSchema } from "@pato-food/content-contract";

type ReleaseConfiguration = { internalOnly: boolean; publishBlocked: boolean };

export const privateRobotsDirective = "noindex, nofollow, noarchive";

export function isNonProductionDeployment(environment: string | undefined) {
  const configured = environment?.trim();
  return Boolean(configured && configured !== "production");
}

export function assertPublicSeoConfiguration(config: ReleaseConfiguration) {
  if (config.internalOnly || config.publishBlocked)
    throw new Error("Public release blocked by the client configuration");
}

function hasHttpsSiteUrl(value: string | undefined) {
  try {
    return httpsUrlSchema.safeParse(value?.trim()).success;
  } catch {
    // The contract refinement can throw for a malformed string. Configuration
    // errors must restrict indexing, never interrupt the response proxy.
    return false;
  }
}

export function shouldNoIndexResponse({
  source,
  visibility,
  config,
  siteUrl,
  runtimeEnvironment,
  deploymentEnvironment,
  draftCookie,
  pathname,
}: {
  source: string | undefined;
  visibility: string | undefined;
  config: ReleaseConfiguration;
  siteUrl: string | undefined;
  runtimeEnvironment: string | undefined;
  deploymentEnvironment: string | undefined;
  draftCookie: boolean;
  pathname: string;
}) {
  return (
    draftCookie ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    runtimeEnvironment !== "production" ||
    isNonProductionDeployment(deploymentEnvironment) ||
    source?.trim() !== "sanity" ||
    visibility?.trim() !== "public" ||
    config.internalOnly ||
    config.publishBlocked ||
    !hasHttpsSiteUrl(siteUrl)
  );
}
