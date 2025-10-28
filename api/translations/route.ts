import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "@/lib/i18n/translation-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { themeId, templateId, language } = body as {
      themeId: string;
      templateId: string;
      language: string;
    };

    const translations = await getTranslations({
      themeId,
      templateId,
      language,
    });

    return NextResponse.json({ data: translations });
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
