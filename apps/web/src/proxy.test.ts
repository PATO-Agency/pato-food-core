import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "../next.config";
import { proxy } from "./proxy";

vi.mock("@pato-food/vicafoods", () => ({
  vicafoodsConfig: {
    siteKey: "approved-test-site",
    internalOnly: false,
    publishBlocked: false,
  },
}));

const noindex = "noindex, nofollow, noarchive";

function response(path = "/", cookie?: string) {
  return proxy(
    new NextRequest(`https://food.example${path}`, {
      headers: cookie ? { cookie } : undefined,
    }),
  );
}

describe("HTTP indexing policy", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("PATO_CONTENT_SOURCE", "sanity");
    vi.stubEnv("PATO_SITE_VISIBILITY", "public");
    vi.stubEnv("PATO_SITE_URL", "https://food.example");
    vi.stubEnv("PATO_HOSTED_INTERNAL_PREVIEW", "authenticated");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("does not stamp noindex on every route in Next configuration", async () => {
    const headers = await nextConfig.headers!();
    expect(
      headers
        .flatMap((entry) => entry.headers)
        .some((header) => header.key === "X-Robots-Tag"),
    ).toBe(false);
    expect(headers[0]?.headers).toContainEqual({
      key: "X-Content-Type-Options",
      value: "nosniff",
    });
  });

  it("allows an approved published production page to be indexed", () => {
    expect(response().headers.get("X-Robots-Tag")).toBeNull();
  });

  it("keeps an internal hosted demo out of search engines", () => {
    vi.stubEnv("PATO_SITE_VISIBILITY", "internal");
    expect(response().headers.get("X-Robots-Tag")).toBe(noindex);
  });

  it.each(["preview", "development", "unknown"])(
    "keeps a %s deployment non-indexable even with public config",
    (environment) => {
      vi.stubEnv("VERCEL_ENV", environment);
      expect(response().headers.get("X-Robots-Tag")).toBe(noindex);
    },
  );

  it("keeps a draft cookie non-indexable and uncached", () => {
    const result = response("/", "__prerender_bypass=untrusted-cookie");
    expect(result.headers.get("X-Robots-Tag")).toBe(noindex);
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it.each(["/api/draft/enable", "/api/revalidate/sanity"])(
    "keeps %s out of search engines",
    (path) => {
      expect(response(path).headers.get("X-Robots-Tag")).toBe(noindex);
    },
  );

  it.each(["fixture", "unknown"])("never indexes %s content", (source) => {
    vi.stubEnv("PATO_CONTENT_SOURCE", source);
    expect(response().headers.get("X-Robots-Tag")).toBe(noindex);
  });

  it.each(["", "not-a-url", "http://food.example"])(
    "keeps a missing or insecure canonical URL non-indexable",
    (url) => {
      vi.stubEnv("PATO_SITE_URL", url);
      expect(response().headers.get("X-Robots-Tag")).toBe(noindex);
    },
  );
});
