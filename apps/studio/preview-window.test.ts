// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import type { SanityClient } from "@sanity/client";
import { openDraftPreview } from "./preview-window";

const { createSecret } = vi.hoisted(() => ({ createSecret: vi.fn() }));
vi.mock("@sanity/preview-url-secret/create-secret", () => ({
  createPreviewSecret: createSecret,
}));
const client = {} as SanityClient;
afterEach(() => vi.resetAllMocks());

it("opens an expiring Sanity preview on the configured host without a Vercel bypass", async () => {
  const assign = vi.fn();
  const popup = { opener: window, location: { assign }, close: vi.fn() };
  vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
  createSecret.mockResolvedValue({
    secret: "ephemeral-test-secret",
    expiresAt: new Date(),
  });
  await openDraftPreview("https://preview.example", client);
  const url = new URL(assign.mock.calls[0]![0] as string);
  expect(url.origin).toBe("https://preview.example");
  expect(url.pathname).toBe("/api/draft/enable");
  expect(url.searchParams.get("sanity-preview-secret")).toBe(
    "ephemeral-test-secret",
  );
  expect(url.searchParams.get("sanity-preview-pathname")).toBe("/");
  expect(url.searchParams.has("x-vercel-protection-bypass")).toBe(false);
  expect(popup.opener).toBe(null);
});

it("does not create a secret when the browser blocks the new tab", async () => {
  vi.spyOn(window, "open").mockReturnValue(null);
  await expect(
    openDraftPreview("https://preview.example", client),
  ).rejects.toThrow("Permite");
  expect(createSecret).not.toHaveBeenCalled();
});

it("closes the empty tab and hides network errors that may contain credentials", async () => {
  const close = vi.fn();
  vi.spyOn(window, "open").mockReturnValue({
    opener: null,
    location: {},
    close,
  } as unknown as Window);
  createSecret.mockRejectedValue(new Error("private-token-must-not-escape"));
  await expect(
    openDraftPreview("https://preview.example", client),
  ).rejects.toThrow("No se pudo abrir");
  expect(close).toHaveBeenCalledOnce();
});

it.each([
  "https://preview.example/?secret=bundled",
  "http://external.example",
  "javascript:alert(1)",
])("rejects an unsafe configured preview URL: %s", async (origin) => {
  const open = vi.spyOn(window, "open");
  await expect(openDraftPreview(origin, client)).rejects.toThrow();
  expect(open).not.toHaveBeenCalled();
  expect(createSecret).not.toHaveBeenCalled();
});
