import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendMutableCookies,
  MutableRequestCookiesAdapter,
} from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { RequestCookies } from "next/dist/server/web/spec-extension/cookies";

const mocks = vi.hoisted(() => ({ draftMode: vi.fn(), cookies: vi.fn() }));
vi.mock("next/headers", () => mocks);
import { GET } from "./route";

describe("GET /api/draft/disable", () => {
  let jar: ReturnType<typeof MutableRequestCookiesAdapter.wrap>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    jar = MutableRequestCookiesAdapter.wrap(new RequestCookies(new Headers()));
    mocks.cookies.mockResolvedValue(jar);
    // Model Next's DraftModeProvider.disable, including its pending cookie write.
    mocks.draftMode.mockResolvedValue({
      disable: () =>
        jar.set({
          name: "__prerender_bypass",
          value: "",
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
          expires: new Date(0),
        }),
    });
  });
  afterEach(() => vi.unstubAllEnvs());

  async function finalResponse(url: string) {
    const response = await GET(new Request(url));
    // AppRoute performs this merge after the handler returns. It deduplicates
    // cookie names when mutable cookies exist, even for distinct partition keys.
    const headers = new Headers(response.headers);
    appendMutableCookies(headers, jar);
    return { response, headers, cookies: headers.getSetCookie() };
  }

  it("expires both partitioned and traditional preview cookies after Next's final merge", async () => {
    const { response, headers, cookies } = await finalResponse(
      "https://preview.example/api/draft/disable",
    );
    expect(cookies).toHaveLength(2);
    const partitioned = cookies.filter((cookie) =>
      /;\s*Partitioned(?:;|$)/i.test(cookie),
    );
    const traditional = cookies.filter(
      (cookie) => !/;\s*Partitioned(?:;|$)/i.test(cookie),
    );
    expect(partitioned).toHaveLength(1);
    expect(traditional).toHaveLength(1);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/^__prerender_bypass=;/);
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
      expect(cookie).toContain("HttpOnly");
    }
    expect(partitioned[0]).toContain("Secure");
    expect(partitioned[0]).toContain("SameSite=None");
    expect(response.status).toBe(307);
    expect(headers.get("location")).toBe("https://preview.example/");
    expect(headers.get("cache-control")).toBe("private, no-store");
    expect(headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("clears the local HTTP preview without requiring Secure or Partitioned", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { headers, cookies } = await finalResponse(
      "http://localhost:3000/api/draft/disable",
    );
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatch(/^__prerender_bypass=;/);
    expect(cookies[0]).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(cookies[0]).not.toContain("Secure");
    expect(cookies[0]).not.toContain("Partitioned");
    expect(headers.get("location")).toBe("http://localhost:3000/");
  });
});
