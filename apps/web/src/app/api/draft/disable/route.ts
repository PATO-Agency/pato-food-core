import { NextResponse } from "next/server";
import { privateHeaders } from "../../../../lib/preview-security";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secure = process.env.NODE_ENV === "production";
  const response = NextResponse.redirect(new URL("/", url), {
    headers: privateHeaders,
  });
  const expiry =
    "__prerender_bypass=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly";
  // Do not mutate the cookie jar or call draft.disable(): Next's final mutable
  // cookie merge deduplicates by name and would drop one partition's expiry.
  // The redirected request reads Draft Mode disabled after both cookies expire.
  response.headers.append(
    "Set-Cookie",
    `${expiry}; SameSite=${secure ? "None; Secure" : "Lax"}`,
  );
  if (secure && url.protocol === "https:")
    response.headers.append(
      "Set-Cookie",
      `${expiry}; SameSite=None; Secure; Partitioned`,
    );
  return response;
}
