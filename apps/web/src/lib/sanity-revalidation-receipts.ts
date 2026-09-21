import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@sanity/client";

const RECEIPT_TYPE = "revalidationReceipt";
const LEASE_MS = 30_000;

type ReceiptStatus = "pending" | "processing" | "completed" | "failed";
type Receipt = Readonly<{
  _id: string;
  _rev: string;
  status: ReceiptStatus;
  leaseUntil?: string;
}>;

export type ReceiptClaim =
  | { state: "claimed"; receiptId: string }
  | { state: "replay"; receiptId: string };

type SanityMutationClient = {
  fetch: (
    query: string,
    params: Record<string, string>,
  ) => Promise<Receipt | null>;
  mutate: (mutation: unknown) => Promise<unknown>;
};

function receiptId(eventHash: string) {
  return `revalidation-receipt.${eventHash}`;
}

export function hashIdempotencyKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

function canClaim(receipt: Receipt, now: Date) {
  return (
    receipt.status === "pending" ||
    receipt.status === "failed" ||
    (receipt.status === "processing" &&
      (!receipt.leaseUntil || Date.parse(receipt.leaseUntil) <= now.getTime()))
  );
}

/**
 * Claims a durable event receipt with a revision-guarded lease. A competing
 * request can only observe a replay state; it never owns the same event.
 */
export async function claimReceipt(
  client: SanityMutationClient,
  idempotencyKey: string,
  now = new Date(),
): Promise<ReceiptClaim> {
  const eventHash = hashIdempotencyKey(idempotencyKey);
  const id = receiptId(eventHash);
  await client.mutate({
    createIfNotExists: {
      _id: id,
      _type: RECEIPT_TYPE,
      eventHash,
      status: "pending",
      attempts: 0,
      createdAt: now.toISOString(),
    },
  });
  const receipt = await client.fetch(
    "*[_id == $id][0]{_id, _rev, status, leaseUntil}",
    { id },
  );
  if (!receipt || !canClaim(receipt, now))
    return { state: "replay", receiptId: id };

  const leaseUntil = new Date(now.getTime() + LEASE_MS).toISOString();
  try {
    await client.mutate({
      patch: {
        id,
        ifRevisionID: receipt._rev,
        set: { status: "processing", leaseUntil, updatedAt: now.toISOString() },
        inc: { attempts: 1 },
        unset: ["failedAt", "failure"],
      },
    });
    return { state: "claimed", receiptId: id };
  } catch {
    // A revision conflict means another invocation has claimed it.
    return { state: "replay", receiptId: id };
  }
}

async function settleReceipt(
  client: SanityMutationClient,
  id: string,
  status: "completed" | "failed",
) {
  const now = new Date().toISOString();
  await client.mutate({
    patch: {
      id,
      set:
        status === "completed"
          ? { status, completedAt: now }
          : { status, failedAt: now },
      unset: ["leaseUntil"],
    },
  });
}

export function completeReceipt(client: SanityMutationClient, id: string) {
  return settleReceipt(client, id, "completed");
}

export function failReceipt(client: SanityMutationClient, id: string) {
  return settleReceipt(client, id, "failed");
}

export function createRevalidationReceiptClient(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): SanityMutationClient {
  const projectId = environment.SANITY_PROJECT_ID?.trim();
  const dataset = environment.SANITY_DATASET?.trim();
  const token = environment.SANITY_REVALIDATION_TOKEN?.trim();
  if (!projectId || !/^[a-z0-9-]+$/.test(projectId))
    throw new Error("SANITY_PROJECT_ID is missing or invalid");
  if (!dataset || !/^[a-z0-9_-]+$/.test(dataset))
    throw new Error("SANITY_DATASET is missing or invalid");
  if (!token || token.length < 24)
    throw new Error("SANITY_REVALIDATION_TOKEN is missing or invalid");
  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2026-09-18",
    useCdn: false,
    token,
  });
  return {
    fetch: (query, params) => client.fetch(query, params),
    mutate: (mutation) => client.mutate(mutation as never),
  };
}
