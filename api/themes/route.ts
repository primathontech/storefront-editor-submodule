import { NextRequest, NextResponse } from "next/server";
import { getMerchantName } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { themeId } = body as {
      themeId: string;
    };

    // const response = await fetch(`${this.apiURL}/api/v1/themes/${themeId}`);

    const merchantName = getMerchantName();

    const themeStructure = await import(
      `@/themes/${merchantName}/theme-structure.json`
    );

    return NextResponse.json({ data: themeStructure });
  } catch (error) {
    console.error("Error fetching editor data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch editor data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
