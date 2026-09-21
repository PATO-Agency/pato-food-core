import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { privateHeaders } from "../../../../lib/preview-security";
export async function GET(request: Request) {
  const draft = await draftMode();
  draft.disable();
  return NextResponse.redirect(new URL("/", request.url), {
    headers: privateHeaders,
  });
}
