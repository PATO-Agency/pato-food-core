import { draftMode, cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isLocalDevelopmentPreview,
  privateHeaders,
  safeRedirect,
  secretsMatch,
} from "../../../../lib/preview-security";
import { validatePresentationPreview } from "../../../../lib/presentation-preview";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const localPreview = isLocalDevelopmentPreview(url);
  const manualPreview = secretsMatch(
    url.searchParams.get("secret"),
    process.env.SANITY_PREVIEW_SECRET,
  );
  let presentationPreview = false;
  let presentationRedirect: string | undefined;
  if (url.searchParams.has("sanity-preview-secret")) {
    try {
      const result = await validatePresentationPreview(request.url);
      presentationPreview = result.isValid;
      presentationRedirect = result.redirectTo;
    } catch {
      presentationPreview = false;
    }
  }
  if (!localPreview && !manualPreview && !presentationPreview)
    return NextResponse.json(
      { error: "Preview unauthorized or not configured" },
      { status: 401, headers: privateHeaders },
    );
  const draft = await draftMode();
  draft.enable();
  const jar = await cookies();
  const cookie = jar.get("__prerender_bypass");
  if (cookie)
    jar.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        presentationPreview && process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      partitioned: presentationPreview && process.env.NODE_ENV === "production",
      maxAge: presentationPreview ? 3600 : 1800,
      path: "/",
    });
  return NextResponse.redirect(
    new URL(
      safeRedirect(presentationRedirect ?? url.searchParams.get("redirect")),
      url.origin,
    ),
    { headers: privateHeaders },
  );
}
