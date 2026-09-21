import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validSignature: vi.fn(),
  revalidateTag: vi.fn(),
  createClient: vi.fn(),
  claim: vi.fn(),
  complete: vi.fn(),
  fail: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@sanity/webhook", () => ({
  SIGNATURE_HEADER_NAME: "sanity-signature",
  isValidSignature: mocks.validSignature,
}));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("../../../../lib/sanity-revalidation-receipts", () => ({
  createRevalidationReceiptClient: mocks.createClient,
  claimReceipt: mocks.claim,
  completeReceipt: mocks.complete,
  failReceipt: mocks.fail,
  hashIdempotencyKey: (key: string) => `hash:${key}`,
}));

import { POST } from "./route";

const secret = "s".repeat(32);
const canonical = JSON.stringify({ _id: "menu-1", _type: "menuItem" });

function request(
  body = canonical,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://test.local/api/revalidate/sanity", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sanity-signature": "valid",
      "sanity-dataset": "sandbox",
      "sanity-document-id": "menu-1",
      "sanity-operation": "update",
      "sanity-project-id": "project-id",
      "sanity-transaction-id": "transaction-1",
      "sanity-transaction-time": "2026-09-20T12:00:00Z",
      "sanity-webhook-id": "webhook-1",
      "idempotency-key": "event-1",
      ...headers,
    },
    body,
  });
}

async function assertPrivate(response: Response) {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
}

describe("POST /api/revalidate/sanity", () => {
  beforeEach(() => {
    process.env.SANITY_WEBHOOK_SECRET = secret;
    process.env.SANITY_PROJECT_ID = "project-id";
    process.env.SANITY_DATASET = "sandbox";
    process.env.SANITY_WEBHOOK_ID = "webhook-1";
    vi.spyOn(console, "info").mockImplementation(mocks.logInfo);
    vi.spyOn(console, "warn").mockImplementation(mocks.logWarn);
    vi.spyOn(console, "error").mockImplementation(mocks.logError);
    mocks.validSignature.mockResolvedValue(true);
    mocks.createClient.mockReturnValue({});
    mocks.claim.mockResolvedValue({ state: "claimed", receiptId: "receipt-1" });
    mocks.complete.mockResolvedValue(undefined);
    mocks.fail.mockResolvedValue(undefined);
  });
  afterEach(() => {
    delete process.env.SANITY_WEBHOOK_SECRET;
    delete process.env.SANITY_PROJECT_ID;
    delete process.env.SANITY_DATASET;
    delete process.env.SANITY_WEBHOOK_ID;
    delete process.env.PATO_HOSTED_INTERNAL_PREVIEW;
    vi.restoreAllMocks();
  });

  it.each(["create", "update", "delete"])(
    "accepts the published %s event and invalidates its tag once",
    async (operation) => {
      const response = await POST(
        request(canonical, { "sanity-operation": operation }),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ revalidated: ["menu"] });
      expect(mocks.revalidateTag).toHaveBeenCalledTimes(1);
      expect(mocks.complete).toHaveBeenCalledWith({}, "receipt-1");
      const event = JSON.parse(
        String(mocks.logInfo.mock.calls.at(-1)?.[0]),
      ) as Record<string, unknown>;
      expect(event).toMatchObject({
        event: "sanity_webhook",
        outcome: "completed",
        projectId: "project-id",
        dataset: "sandbox",
        webhookId: "webhook-1",
        transactionId: "transaction-1",
        documentId: "menu-1",
        operation,
        status: 200,
      });
      expect(JSON.stringify(event)).not.toContain(secret);
      await assertPrivate(response);
    },
  );

  it("responds to a replay without another invalidation", async () => {
    mocks.claim.mockResolvedValue({ state: "replay", receiptId: "receipt-1" });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ replay: true });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
    await assertPrivate(response);
  });

  it("verifies the unparsed request text before JSON handling", async () => {
    const raw = '{  "_id" : "menu-1", "_type" : "menuItem" }';
    const response = await POST(request(raw));
    expect(response.status).toBe(200);
    expect(mocks.validSignature).toHaveBeenCalledWith(raw, "valid", secret);
  });

  it.each([
    [{ "idempotency-key": " " }, 400, "invalid_idempotency_key"],
    [{ "sanity-operation": "publish" }, 400, "invalid_operation"],
    [{ "content-type": "text/plain" }, 415, "invalid_content_type"],
    [{ "sanity-signature": "" }, 401, "invalid_signature"],
  ] as const)(
    "rejects invalid request metadata",
    async (headers, status, outcome) => {
      const response = await POST(request(canonical, headers));
      expect(response.status).toBe(status);
      expect(mocks.claim).not.toHaveBeenCalled();
      const event = JSON.parse(
        String(mocks.logWarn.mock.calls.at(-1)?.[0]),
      ) as Record<string, unknown>;
      expect(event).toMatchObject({ outcome, status });
      expect(JSON.stringify(event)).not.toContain(secret);
      await assertPrivate(response);
    },
  );

  it("requires an idempotency key", async () => {
    const response = await POST(
      new Request("http://test.local/api/revalidate/sanity", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "sanity-signature": "valid",
          "sanity-operation": "update",
        },
        body: canonical,
      }),
    );
    expect(response.status).toBe(400);
    await assertPrivate(response);
  });

  it("rejects a validly signed delivery from another project or webhook", async () => {
    for (const headers of [
      { "sanity-project-id": "other-project" },
      { "sanity-webhook-id": "other-webhook" },
      { "sanity-document-id": "other-document" },
    ] as Record<string, string>[]) {
      const response = await POST(request(canonical, headers));
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Unexpected webhook source",
      });
    }
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.logWarn).toHaveBeenCalledTimes(3);
  });

  it("fails closed when the expected project or dataset is not configured", async () => {
    delete process.env.SANITY_DATASET;
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.validSignature).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalledOnce();
  });

  it("requires the configured webhook ID on a hosted internal preview", async () => {
    process.env.PATO_HOSTED_INTERNAL_PREVIEW = "authenticated";
    delete process.env.SANITY_WEBHOOK_ID;
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.validSignature).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalledOnce();
  });

  it("rejects malformed, draft, unsupported and oversized bodies", async () => {
    for (const [body, headers, status] of [
      ["{", {}, 400],
      [JSON.stringify({ _id: "drafts.menu-1", _type: "menuItem" }), {}, 400],
      [JSON.stringify({ _id: "menu-1", _type: "unknown" }), {}, 400],
      ["x".repeat(16 * 1024 + 1), { "content-length": "16385" }, 413],
    ] as const) {
      const response = await POST(request(body, headers));
      expect(response.status).toBe(status);
      await assertPrivate(response);
    }
  });

  it("fails closed when signature verification throws", async () => {
    mocks.validSignature.mockRejectedValue(new Error("bad verifier"));
    const response = await POST(request());
    expect(response.status).toBe(401);
    await assertPrivate(response);
  });

  it("marks a claimed receipt failed so a later delivery may retry", async () => {
    mocks.revalidateTag.mockImplementation(() => {
      throw new Error("cache unavailable");
    });
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(mocks.fail).toHaveBeenCalledWith({}, "receipt-1");
    await assertPrivate(response);
  });
});
