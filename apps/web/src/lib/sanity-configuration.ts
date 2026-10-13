export function readSanityConfiguration(
  environment: Readonly<Record<string, string | undefined>>,
) {
  const projectId = environment.SANITY_PROJECT_ID?.trim();
  const dataset = environment.SANITY_DATASET?.trim();
  const token = environment.SANITY_READ_TOKEN?.trim();
  if (!projectId || !/^[a-z0-9-]+$/.test(projectId))
    throw new Error("SANITY_PROJECT_ID is missing or invalid");
  if (!dataset || !/^[a-z0-9_-]+$/.test(dataset))
    throw new Error("SANITY_DATASET is missing or invalid");
  if (!token || token.length < 24)
    throw new Error("Private CMS reads require SANITY_READ_TOKEN");
  return { projectId, dataset, token };
}

/** Explicit opt-in for the private demonstration, never a production bypass. */
export function readInternalDemoNamespace(
  environment: Readonly<Record<string, string | undefined>>,
): string | undefined {
  const demoSite = environment.PATO_DEMO_SITE?.trim();
  if (!demoSite) return undefined;
  if (
    demoSite !== "vicafoods" ||
    environment.PATO_SITE_VISIBILITY?.trim() !== "internal" ||
    environment.SANITY_DATASET?.trim() !== "sandbox" ||
    environment.VERCEL_ENV?.trim() === "production"
  )
    throw new Error(
      "Vicafoods demonstration requires an internal sandbox outside production",
    );
  return "pato-demo-vicafoods-";
}
