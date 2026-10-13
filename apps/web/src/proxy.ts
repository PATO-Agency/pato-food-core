import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { mayServeRequest } from "./lib/deployment-policy";
import { vicafoodsConfig } from "@pato-food/vicafoods";
import {
  privateRobotsDirective,
  shouldNoIndexResponse,
} from "./lib/indexing-policy";

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
  ) {
    const response = NextResponse.next();
    const draftCookie = request.cookies.has("__prerender_bypass");
    if (
      shouldNoIndexResponse({
        source: process.env.PATO_CONTENT_SOURCE,
        visibility: process.env.PATO_SITE_VISIBILITY,
        config: vicafoodsConfig,
        siteUrl: process.env.PATO_SITE_URL,
        runtimeEnvironment: process.env.NODE_ENV,
        deploymentEnvironment: process.env.VERCEL_ENV,
        draftCookie,
        pathname: request.nextUrl.pathname,
      })
    )
      response.headers.set("X-Robots-Tag", privateRobotsDirective);
    // A cookie cannot grant draft access here; it only makes the response more
    // restrictive. Next validates Draft Mode and the enable route authenticates it.
    if (draftCookie) response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  return new NextResponse("Not found", {
    status: 404,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": privateRobotsDirective,
    },
  });
}

export const config = { matcher: "/:path*" };
