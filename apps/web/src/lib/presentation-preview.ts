import "server-only";
import { createClient } from "@sanity/client";
import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { readSanityConfiguration } from "./sanity-configuration";

export async function validatePresentationPreview(
  requestUrl: string,
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const { projectId, dataset, token } = readSanityConfiguration(environment);
  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2026-09-18",
    useCdn: false,
    token,
  });
  return validatePreviewUrl(client, requestUrl);
}
