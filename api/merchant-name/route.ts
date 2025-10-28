import { NextResponse } from "next/server";
import { getMerchantName } from "@/lib/utils";

export async function GET() {
  try {
    const merchantName = getMerchantName();

    return NextResponse.json({
      data: {
        merchantName,
      },
    });
  } catch (error) {
    console.error("Error getting merchant ID:", error);
    return NextResponse.json(
      { error: "Failed to get merchant ID" },
      { status: 500 }
    );
  }
}
