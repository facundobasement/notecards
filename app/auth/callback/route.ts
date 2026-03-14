import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect") ?? "/app";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}


