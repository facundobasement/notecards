import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ALLOWED_MODELS = ["claude-sonnet-4-20250514"];

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "ANTHROPIC_API_KEY is not configured" } },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  // Validate request shape
  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    typeof body.model !== "string" ||
    !ALLOWED_MODELS.includes(body.model as string) ||
    (body.max_tokens !== undefined &&
      (typeof body.max_tokens !== "number" ||
        body.max_tokens < 1 ||
        body.max_tokens > 8192))
  ) {
    return NextResponse.json(
      { error: { message: "Invalid request: check model, messages, and max_tokens" } },
      { status: 400 }
    );
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    signal: request.signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
