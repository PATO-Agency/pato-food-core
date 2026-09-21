import { describe, expect, it } from "vitest";
import { frameAncestorsDirective, trustedStudioOrigin } from "./framing-policy";

describe("preview framing policy", () => {
  it("allows only the current origin when Studio is not configured", () => {
    expect(frameAncestorsDirective(undefined)).toBe("frame-ancestors 'self'");
  });

  it("allows one exact HTTPS Studio origin", () => {
    expect(frameAncestorsDirective("https://editor.example.com/")).toBe(
      "frame-ancestors 'self' https://editor.example.com",
    );
  });

  it("permits loopback HTTP for local Studio development", () => {
    expect(trustedStudioOrigin("http://localhost:3333")).toBe(
      "http://localhost:3333",
    );
  });

  it.each([
    "http://editor.example.com",
    "https://user:password@editor.example.com",
    "https://editor.example.com/path",
    "https://editor.example.com/?token=value",
  ])("rejects an unsafe or non-origin Studio value: %s", (value) => {
    expect(() => trustedStudioOrigin(value)).toThrow();
  });
});
