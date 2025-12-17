import { NextRequest, NextResponse } from "next/server";
import { getCommerceClient } from "@/lib/data-layer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body as { type: string };

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    const commerceClient = getCommerceClient();

    if (type === "collections") {
      const response = await commerceClient.getCollections({
        first: 250,
      });
      return NextResponse.json({
        data: response.collections.map((collection) => ({
          value: collection.handle,
          label: collection.title,
        })),
      });
    }

    if (type === "products") {
      const response = await commerceClient.getProducts({
        first: 250,
      });
      return NextResponse.json({
        data: response.products.map((product) => ({
          value: product.handle,
          label: product.title,
        })),
      });
    }

    return NextResponse.json(
      { error: `Unsupported type: ${type}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching data source options:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch data source options",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
