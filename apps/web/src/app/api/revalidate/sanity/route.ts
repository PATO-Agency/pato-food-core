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
  const hostedInternalPreview =
    process.env.PATO_HOSTED_INTERNAL_PREVIEW?.trim() === "authenticated";
  if (!projectId || !/^[a-z0-9-]+$/.test(projectId)) return null;
  if (!dataset || !/^[a-z0-9_-]+$/.test(dataset)) return null;
  if (hostedInternalPreview && !webhookId) return null;
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

function reject(
  request: Request,
  outcome: string,
  status: number,
  message: string,
) {
  logWebhook("warn", request, outcome, status);
  return response({ error: message }, status);
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  const source = expectedSource();
  if (!secret || secret.length < 32 || !source) {
    logWebhook("error", request, "configuration_unavailable", 503);
    return response({ error: "Webhook is not configured" }, 503);
  }
  if (!request.headers.get("content-type")?.includes("application/json"))
    return reject(request, "invalid_content_type", 415, "JSON required");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES)
    return reject(request, "payload_too_large", 413, "Payload too large");
  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > 512)
    return reject(
      request,
      "invalid_idempotency_key",
      400,
      "Idempotency-Key required",
    );
  // Bound streamed input too: Content-Length cannot be trusted.
  const reader = request.body?.getReader();
  if (!reader) return reject(request, "missing_body", 400, "Body required");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return reject(request, "payload_too_large", 413, "Payload too large");
      }
      chunks.push(value);
    }
  } catch {
    return reject(request, "unreadable_body", 400, "Body could not be read");
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
    return reject(request, "invalid_json", 400, "Invalid JSON");
  }
  const operation = parseSanityOperation(
    request.headers.get("sanity-operation"),
  );
  if (!operation)
    return reject(
      request,
      "invalid_operation",
      400,
      "Invalid Sanity operation",
    );
  const tags = tagsForWebhook(parsed);
  if (!tags)
    return reject(request, "unsupported_document", 400, "Unsupported document");
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
