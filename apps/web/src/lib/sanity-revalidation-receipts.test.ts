import { describe, expect, it, vi } from "vitest";
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

  it("does not claim completed or active leases, but reclaims expired leases and failures", async () => {
    const now = new Date("2026-09-19T12:00:00Z");
    for (const current of [
      { ...receipt, status: "completed" as const },
      {
        ...receipt,
        status: "processing" as const,
        leaseUntil: "2026-09-19T12:00:01Z",
      },
    ]) {
      const mutate = vi.fn().mockResolvedValue(undefined);
      const result = await claimReceipt(
        { mutate, fetch: vi.fn().mockResolvedValue(current) },
        "event-2",
        now,
      );
      expect(result.state).toBe("replay");
      expect(mutate).toHaveBeenCalledTimes(1);
    }
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

  it("treats a competing revision update as a replay", async () => {
    const client = {
      fetch: vi.fn().mockResolvedValue(receipt),
      mutate: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("conflict")),
    };
    expect((await claimReceipt(client, "event-4")).state).toBe("replay");
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
