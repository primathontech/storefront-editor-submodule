import { NextRequest, NextResponse } from "next/server";
import { aggregateData } from "@/lib/page-builder/core/data-aggregator";
import {
  PageConfig,
  RouteContext,
} from "@/lib/page-builder/models/page-config-types";
import { initializeUniversalRouteDataProvider } from "@/lib/page-builder/core/universal-route-data-provider";

export async function POST(request: NextRequest) {
  try {
    // Initialize universal route data provider for editor
    initializeUniversalRouteDataProvider();

    const body = await request.json();
    const { pageConfig, routeContext, merchantName } = body as {
      pageConfig: PageConfig;
      routeContext: RouteContext;
      merchantName: string;
    };

    if (!pageConfig) {
      return NextResponse.json(
        { error: "pageConfig is required" },
        { status: 400 }
      );
    }

    // Use the same data aggregation function as production
    const data = await aggregateData({
      merchantName,
      pageConfig,
      routeContext,
    });

    return NextResponse.json(data);
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
