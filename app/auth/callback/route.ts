import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect") ?? "/app";

  // Prevent open redirect: only allow relative paths
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/app";

  return NextResponse.redirect(new URL(safeRedirect, request.url));
}


