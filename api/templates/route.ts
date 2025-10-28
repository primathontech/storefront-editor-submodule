import { NextRequest, NextResponse } from "next/server";
import { RouteContext } from "@/lib/page-builder/models/page-config-types";
import { TemplateResolver } from "@/lib/page-builder/core/template-resolver";
import { merchantTemplateLoader } from "@/template-loader";

const templateResolver = new TemplateResolver(merchantTemplateLoader);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantName, routeContext, variant } = body as {
      merchantName: string;
      routeContext: RouteContext;
      variant: string;
    };

    const template = await templateResolver.resolveTemplate({
      merchantName,
      routeContext,
      variant,
    });

    return NextResponse.json({ data: template });
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
