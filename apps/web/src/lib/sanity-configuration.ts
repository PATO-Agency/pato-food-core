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
