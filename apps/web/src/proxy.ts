import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { mayServeRequest } from "./lib/deployment-policy";

export function proxy(request: NextRequest) {
  const forwardedHostnames =
    request.headers
      .get("x-forwarded-host")
      ?.split(",")
      .map((hostname) => hostname.trim()) ?? [];
  if (
    mayServeRequest({
      hostnames: [
        request.nextUrl.hostname,
        request.headers.get("host") ?? "",
        ...forwardedHostnames,
      ],
      visibility: process.env.PATO_SITE_VISIBILITY,
      hostedPreview: process.env.PATO_HOSTED_INTERNAL_PREVIEW,
      runtimeEnvironment: process.env.NODE_ENV,
      localInternal: process.env.PATO_LOCAL_INTERNAL,
    })
  )
    return NextResponse.next();

  return new NextResponse("Not found", {
    status: 404,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export const config = { matcher: "/:path*" };
