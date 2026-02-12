import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy to Anthropic's Messages API.
 * Keeps the API key on the server and prevents it from ever reaching the client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const requestBody = body?.requestBody;

    if (!requestBody || typeof requestBody !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid requestBody payload" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Anthropic API key on server" },
        { status: 500 }
      );
    }

    const upstreamResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "structured-outputs-2025-11-13",
          "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text().catch(() => "");
      console.error("Anthropic API error via proxy:", {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        error: errorText,
      });

      return NextResponse.json(
        { error: "Failed to generate AI response" },
        { status: 502 }
      );
    }

    const data = await upstreamResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in /editor/api/anthropic:", error);
    return NextResponse.json(
      { error: "Unexpected error while calling Anthropic" },
      { status: 500 }
    );
  }
}
