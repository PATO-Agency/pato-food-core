import { describe, expect, it } from "vitest";
import { resolveContentPolicy, shouldReadDraftContent } from "./content-policy";

describe("content policy", () => {
  it("uses Sanity drafts automatically only for local internal development", () => {
    expect(
      shouldReadDraftContent({
        draftModeEnabled: false,
        source: "sanity",
        visibility: "internal",
        runtimeEnvironment: "development",
      }),
    ).toBe(true);
    expect(
      shouldReadDraftContent({
        draftModeEnabled: false,
        source: "sanity",
        visibility: "internal",
        runtimeEnvironment: "production",
      }),
    ).toBe(false);
    expect(
      shouldReadDraftContent({
        draftModeEnabled: false,
        source: "fixture",
        visibility: "internal",
        runtimeEnvironment: "development",
      }),
    ).toBe(false);
  });

  it("honors explicit Draft Mode only for an internal Sanity surface", () => {
    expect(
      shouldReadDraftContent({
        draftModeEnabled: true,
        source: "sanity",
        visibility: "internal",
        runtimeEnvironment: "production",
      }),
    ).toBe(true);
    expect(
      shouldReadDraftContent({
        draftModeEnabled: true,
        source: "fixture",
        visibility: "internal",
        runtimeEnvironment: "production",
      }),
    ).toBe(false);
    expect(
      shouldReadDraftContent({
        draftModeEnabled: true,
        source: "sanity",
        visibility: "public",
        runtimeEnvironment: "production",
      }),
    ).toBe(false);
  });

  it("keeps public releases blocked for prospect configurations", () => {
    expect(() =>
      resolveContentPolicy({
        source: "sanity",
        visibility: "public",
        config: { internalOnly: true, publishBlocked: true },
      }),
    ).toThrow("Public release blocked");
  });
});
