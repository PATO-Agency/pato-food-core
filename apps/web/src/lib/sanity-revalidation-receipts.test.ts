import { describe, expect, it, vi } from "vitest";
import { ClientError } from "@sanity/client";
vi.mock("server-only", () => ({}));
import {
  claimReceipt,
  completeReceipt,
  failReceipt,
  hashIdempotencyKey,
} from "./sanity-revalidation-receipts";

const receipt = {
  _id: "revalidation-receipt.any",
  _rev: "revision-1",
  status: "pending" as const,
};
const revisionConflict = () =>
  new ClientError({
    statusCode: 409,
    statusMessage: "Conflict",
    body: { error: "Conflict" },
    headers: {},
  });

describe("Sanity revalidation receipts", () => {
  it("hashes the idempotency key and never persists the raw value", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    const client = { mutate, fetch: vi.fn().mockResolvedValue(receipt) };
    const key = "this-must-never-be-persisted";

    await claimReceipt(client, key, new Date("2026-09-19T12:00:00Z"));

    const create = mutate.mock.calls[0]?.[0] as {
      createIfNotExists: Record<string, unknown>;
    };
    expect(create.createIfNotExists.eventHash).toBe(hashIdempotencyKey(key));
    expect(create.createIfNotExists.createdAt).toBe("2026-09-19T12:00:00.000Z");
    expect(JSON.stringify(create)).not.toContain(key);
    expect(create.createIfNotExists._id).toContain(hashIdempotencyKey(key));
  });

  it("claims a pending receipt through a revision-guarded lease", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    const client = { mutate, fetch: vi.fn().mockResolvedValue(receipt) };

    const result = await claimReceipt(
      client,
      "event-1",
      new Date("2026-09-19T12:00:00Z"),
    );

    expect(result.state).toBe("claimed");
    expect(mutate.mock.calls[1]?.[0]).toMatchObject({
      patch: { ifRevisionID: "revision-1", set: { status: "processing" } },
    });
  });

  it("acknowledges only completed receipts and defers active leases", async () => {
    const now = new Date("2026-09-19T12:00:00Z");
    for (const [current, expected] of [
      [
        {
          ...receipt,
          status: "completed",
          completedAt: "2026-09-19T11:59:59Z",
        },
        "replay",
      ],
      [
        {
          ...receipt,
          status: "processing",
          leaseUntil: "2026-09-19T12:00:01Z",
        },
        "in_progress",
      ],
    ] as const) {
      const mutate = vi.fn().mockResolvedValue(undefined);
      const result = await claimReceipt(
        { mutate, fetch: vi.fn().mockResolvedValue(current) },
        "event-2",
        now,
      );
      expect(result.state).toBe(expected);
      expect(mutate).toHaveBeenCalledTimes(1);
    }
  });

  it("reclaims failed and expired leases through the revision guard", async () => {
    const now = new Date("2026-09-19T12:00:00Z");
    for (const current of [
      { ...receipt, status: "failed" as const },
      {
        ...receipt,
        status: "processing" as const,
        leaseUntil: "2026-09-19T11:59:59Z",
      },
    ]) {
      const mutate = vi.fn().mockResolvedValue(undefined);
      const result = await claimReceipt(
        { mutate, fetch: vi.fn().mockResolvedValue(current) },
        "event-3",
        now,
      );
      expect(result.state).toBe("claimed");
      expect(mutate).toHaveBeenCalledTimes(2);
    }
  });

  it("refetches after a real revision conflict and defers active processing", async () => {
    const client = {
      fetch: vi
        .fn()
        .mockResolvedValueOnce(receipt)
        .mockResolvedValueOnce({
          ...receipt,
          status: "processing",
          leaseUntil: "2026-09-19T12:00:01Z",
        }),
      mutate: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(revisionConflict()),
    };
    expect(
      (await claimReceipt(client, "event-4", new Date("2026-09-19T12:00:00Z")))
        .state,
    ).toBe("in_progress");
    expect(client.fetch).toHaveBeenCalledTimes(2);
  });

  it("recognizes a completed receipt after a revision conflict", async () => {
    const client = {
      fetch: vi
        .fn()
        .mockResolvedValueOnce(receipt)
        .mockResolvedValueOnce({
          ...receipt,
          status: "completed",
          completedAt: "2026-09-19T12:00:00Z",
        }),
      mutate: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(revisionConflict()),
    };
    expect((await claimReceipt(client, "event-4")).state).toBe("replay");
  });

  it("never reports a missing receipt as a replay", async () => {
    const client = {
      mutate: vi.fn().mockResolvedValue(undefined),
      fetch: vi.fn().mockResolvedValue(null),
    };
    await expect(claimReceipt(client, "missing-receipt")).rejects.toThrow();
    expect(client.mutate).toHaveBeenCalledTimes(1);
  });

  it("rejects completed status without a completion timestamp", async () => {
    const client = {
      mutate: vi.fn().mockResolvedValue(undefined),
      fetch: vi.fn().mockResolvedValue({ ...receipt, status: "completed" }),
    };
    await expect(claimReceipt(client, "unproven-completion")).rejects.toThrow();
  });

  it.each([403, 503])(
    "propagates a patch failure with status %s for a retryable response",
    async (statusCode) => {
      const failure = Object.assign(new Error("private upstream failure"), {
        statusCode,
      });
      const client = {
        fetch: vi.fn().mockResolvedValue(receipt),
        mutate: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(failure),
      };
      await expect(claimReceipt(client, "operational-failure")).rejects.toBe(
        failure,
      );
      expect(client.fetch).toHaveBeenCalledTimes(1);
    },
  );

  it("propagates a network failure without interpreting it as a replay", async () => {
    const failure = new Error("network unavailable");
    const client = {
      fetch: vi.fn().mockResolvedValue(receipt),
      mutate: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(failure),
    };
    await expect(claimReceipt(client, "network-failure")).rejects.toBe(failure);
    expect(client.fetch).toHaveBeenCalledTimes(1);
  });

  it("propagates a receipt read failure for a retryable response", async () => {
    const failure = new Error("read unavailable");
    const client = {
      fetch: vi.fn().mockRejectedValue(failure),
      mutate: vi.fn().mockResolvedValue(undefined),
    };
    await expect(claimReceipt(client, "read-failure")).rejects.toBe(failure);
    expect(client.mutate).toHaveBeenCalledTimes(1);
  });

  it("does not mistake an arbitrary error message for a revision conflict", async () => {
    const failure = new Error("conflict");
    const client = {
      fetch: vi.fn().mockResolvedValue(receipt),
      mutate: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(failure),
    };
    await expect(claimReceipt(client, "not-a-409")).rejects.toBe(failure);
  });

  it("fails closed if the receipt remains claimable after a 409", async () => {
    const client = {
      fetch: vi.fn().mockResolvedValue(receipt),
      mutate: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(revisionConflict()),
    };
    await expect(claimReceipt(client, "unresolved-409")).rejects.toThrow();
    expect(client.fetch).toHaveBeenCalledTimes(2);
  });

  it("fails closed if the receipt vanishes after a 409", async () => {
    const client = {
      fetch: vi.fn().mockResolvedValueOnce(receipt).mockResolvedValueOnce(null),
      mutate: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(revisionConflict()),
    };
    await expect(claimReceipt(client, "vanished-409")).rejects.toThrow();
  });

  it("settles successful and failed executions without retaining a lease", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    const client = { mutate, fetch: vi.fn() };
    await completeReceipt(client, "receipt-1");
    await failReceipt(client, "receipt-2");
    expect(mutate.mock.calls[0]?.[0]).toMatchObject({
      patch: {
        id: "receipt-1",
        set: { status: "completed" },
        unset: ["leaseUntil"],
      },
    });
    expect(mutate.mock.calls[1]?.[0]).toMatchObject({
      patch: {
        id: "receipt-2",
        set: { status: "failed" },
        unset: ["leaseUntil"],
      },
    });
  });
});
