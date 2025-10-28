import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { themeCode } = body as { themeCode: string };

    const merchantId = process.env.MERCHANT_ID;
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: "MERCHANT_ID not configured" },
        { status: 500 }
      );
    }

    // Fetch merchant data from external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_EDITOR_API_URL}/api/v1/merchants/${merchantId}`,
      {
        method: "GET",
        headers: { accept: "application/json" },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch merchant data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    if (!data.success) {
      return NextResponse.json(
        { success: false, error: "API returned unsuccessful response" },
        { status: 400 }
      );
    }

    const isValid = data.data.visualEditorId === themeCode;
    
    return NextResponse.json({
      success: true,
      data: {
        isValid,
        themeId: isValid ? data.data.merchantName : undefined,
        error: isValid ? undefined : "Invalid theme code",
      },
    });
  } catch (error) {
    console.error("Merchant validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate merchant",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
