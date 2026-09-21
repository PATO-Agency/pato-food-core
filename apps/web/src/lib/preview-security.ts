import { timingSafeEqual } from "node:crypto";
export function secretsMatch(
  actual: string | null,
  expected: string | undefined,
): boolean {
  if (!actual || !expected || expected.length < 32) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function isLocalDevelopmentPreview(
  url: URL,
  environment = process.env.NODE_ENV,
): boolean {
  return (
    environment === "development" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  );
}
export function safeRedirect(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return "/";
  // Only the one public route is supported; never redirect to API endpoints.
  return value === "/" ? value : "/";
}
export const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};
