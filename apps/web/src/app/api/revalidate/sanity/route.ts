import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  parseSanityOperation,
  tagsForWebhook,
} from "../../../../lib/revalidation";
import { privateHeaders } from "../../../../lib/preview-security";
import {
  claimReceipt,
  completeReceipt,
  createRevalidationReceiptClient,
  failReceipt,
  hashIdempotencyKey,
} from "../../../../lib/sanity-revalidation-receipts";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 16 * 1024;
const MAX_LOG_VALUE_LENGTH = 256;

type WebhookLogLevel = "info" | "warn" | "error";

function headerValue(request: Request, name: string) {
  const value = request.headers.get(name)?.trim();
  return value ? value.slice(0, MAX_LOG_VALUE_LENGTH) : undefined;
}

function logWebhook(
  level: WebhookLogLevel,
  request: Request,
  outcome: string,
  status: number,
  details: Readonly<Record<string, unknown>> = {},
) {
  console[level](
    JSON.stringify({
      event: "sanity_webhook",
      outcome,
      status,
      projectId: headerValue(request, "sanity-project-id"),
      dataset: headerValue(request, "sanity-dataset"),
      webhookId: headerValue(request, "sanity-webhook-id"),
      transactionId: headerValue(request, "sanity-transaction-id"),
      transactionTime: headerValue(request, "sanity-transaction-time"),
      documentId: headerValue(request, "sanity-document-id"),
      operation: headerValue(request, "sanity-operation"),
      ...details,
    }),
  );
}

function expectedSource() {
  const projectId = process.env.SANITY_PROJECT_ID?.trim();
  const dataset = process.env.SANITY_DATASET?.trim();
  const webhookId = process.env.SANITY_WEBHOOK_ID?.trim();
  if (!projectId || !/^[a-z0-9-]+$/.test(projectId)) return null;
  if (!dataset || !/^[a-z0-9_-]+$/.test(dataset)) return null;
  if (webhookId && webhookId.length > MAX_LOG_VALUE_LENGTH) return null;
  return { projectId, dataset, webhookId };
}

function hasExpectedSource(
  request: Request,
  documentId: string,
  expected: NonNullable<ReturnType<typeof expectedSource>>,
) {
  const webhookId = request.headers.get("sanity-webhook-id")?.trim();
  return (
    request.headers.get("sanity-project-id")?.trim() === expected.projectId &&
    request.headers.get("sanity-dataset")?.trim() === expected.dataset &&
    request.headers.get("sanity-document-id")?.trim() === documentId &&
    Boolean(webhookId) &&
    (!expected.webhookId || webhookId === expected.webhookId)
  );
}

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders });
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  const source = expectedSource();
  if (!secret || secret.length < 32 || !source) {
    logWebhook("error", request, "configuration_unavailable", 503);
    return response({ error: "Webhook is not configured" }, 503);
  }
  if (!request.headers.get("content-type")?.includes("application/json"))
    return response({ error: "JSON required" }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES)
    return response({ error: "Payload too large" }, 413);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > 512)
    return response({ error: "Idempotency-Key required" }, 400);
  // Bound streamed input too: Content-Length cannot be trusted.
  const reader = request.body?.getReader();
  if (!reader) return response({ error: "Body required" }, 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return response({ error: "Payload too large" }, 413);
      }
      chunks.push(value);
    }
  } catch {
    return response({ error: "Body could not be read" }, 400);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  try {
    if (!signature || !(await isValidSignature(body, signature, secret))) {
      logWebhook("warn", request, "invalid_signature", 401);
      return response({ error: "Invalid signature" }, 401);
    }
  } catch {
    logWebhook("warn", request, "invalid_signature", 401);
    return response({ error: "Invalid signature" }, 401);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return response({ error: "Invalid JSON" }, 400);
  }
  const operation = parseSanityOperation(
    request.headers.get("sanity-operation"),
  );
  if (!operation) return response({ error: "Invalid Sanity operation" }, 400);
  const tags = tagsForWebhook(parsed);
  if (!tags) return response({ error: "Unsupported document" }, 400);
  const documentId = (parsed as { _id: string })._id;
  if (!hasExpectedSource(request, documentId, source)) {
    logWebhook("warn", request, "unexpected_source", 403);
    return response({ error: "Unexpected webhook source" }, 403);
  }
  const eventHash = hashIdempotencyKey(idempotencyKey);
  let client;
  try {
    client = createRevalidationReceiptClient();
    const claim = await claimReceipt(client, idempotencyKey);
    if (claim.state === "replay") {
      logWebhook("info", request, "replay", 200, {
        eventHash,
        receiptId: claim.receiptId,
      });
      return response({ replay: true, source: "sanity-webhook" });
    }
    try {
      for (const tag of tags) revalidateTag(tag, "max");
      await completeReceipt(client, claim.receiptId);
    } catch {
      try {
        await failReceipt(client, claim.receiptId);
      } catch {
        // Keep the original operation failure private. An expired lease permits recovery.
      }
      logWebhook("error", request, "revalidation_failed", 500, {
        eventHash,
        receiptId: claim.receiptId,
      });
      return response({ error: "Revalidation failed" }, 500);
    }
  } catch {
    logWebhook("error", request, "receipt_unavailable", 503, { eventHash });
    return response({ error: "Webhook receipt unavailable" }, 503);
  }
  logWebhook("info", request, "completed", 200, { eventHash, tags });
  return response({ revalidated: tags, source: "sanity-webhook" });
}
