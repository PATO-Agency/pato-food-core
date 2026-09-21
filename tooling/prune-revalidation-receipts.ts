import { createClient } from "@sanity/client";

const API_VERSION = "2026-09-18";
const DEFAULT_RETENTION_DAYS = 30;
const MINIMUM_RETENTION_DAYS = 7;
const apply = process.argv.includes("--apply");
const confirmedSandboxDelete = process.argv.includes(
  "--confirm-sandbox-delete",
);
const confirmedProject = process.argv
  .find((argument) => argument.startsWith("--confirm-project="))
  ?.slice("--confirm-project=".length);
const retentionArgument = process.argv
  .find((argument) => argument.startsWith("--retention-days="))
  ?.slice("--retention-days=".length);

function retentionDays() {
  if (!retentionArgument) return DEFAULT_RETENTION_DAYS;
  const value = Number(retentionArgument);
  if (!Number.isInteger(value) || value < MINIMUM_RETENTION_DAYS || value > 365)
    throw new Error("Retention must be an integer between 7 and 365 days");
  return value;
}

async function main() {
  const projectId = process.env.SANITY_PROJECT_ID?.trim();
  const dataset = process.env.SANITY_DATASET?.trim();
  const token = process.env.SANITY_REVALIDATION_TOKEN?.trim();
  if (!projectId || !/^[a-z0-9-]+$/.test(projectId))
    throw new Error("SANITY_PROJECT_ID is missing or invalid");
  if (dataset !== "sandbox")
    throw new Error("Receipt pruning is restricted to the sandbox dataset");
  if (!token || token.length < 24)
    throw new Error("SANITY_REVALIDATION_TOKEN is missing or invalid");

  const days = retentionDays();
  const cutoff = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
  const client = createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    perspective: "raw",
    useCdn: false,
    token,
  });
  const ids = await client.fetch<string[]>(
    '*[_type == "revalidationReceipt" && status in ["completed", "failed"] && dateTime(_createdAt) < dateTime($cutoff)]._id',
    { cutoff },
  );

  console.log(
    `receipt-prune project=${projectId} dataset=${dataset} retentionDays=${days} eligible=${ids.length} apply=${apply}`,
  );
  if (!apply) {
    console.log(
      "dry-run=true; add --apply --confirm-sandbox-delete --confirm-project=<projectId>",
    );
    return;
  }
  if (!confirmedSandboxDelete || confirmedProject !== projectId)
    throw new Error(
      "Sandbox deletion and exact project confirmations are required",
    );

  for (let offset = 0; offset < ids.length; offset += 100) {
    let transaction = client.transaction();
    for (const id of ids.slice(offset, offset + 100))
      transaction = transaction.delete(id);
    await transaction.commit({ returnDocuments: false });
  }
  console.log(`receipt-prune deleted=${ids.length}`);
}

await main();
