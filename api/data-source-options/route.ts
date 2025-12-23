import { NextRequest, NextResponse } from "next/server";
import { getCommerceClient } from "@/lib/data-layer";

const OPTION_FETCHERS: Record<
  string,
  (client: ReturnType<typeof getCommerceClient>) => Promise<any[]>
> = {
  collections: async (client) => {
    const response: any = await client.getCollections({ first: 250 });
    const collections = response?.data || [];
    return collections.map((collection: any) => ({
      value: collection.handle,
      label: collection.title,
    }));
  },
  products: async (client) => {
    const response: any = await client.getProducts({ first: 250 });
    const products = response?.data || [];
    return products.map((product: any) => ({
      value: product.handle,
      label: product.title,
    }));
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body as { type: string };

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    const fetcher = OPTION_FETCHERS[type];
    if (!fetcher) {
      return NextResponse.json(
        { error: `Unsupported type: ${type}` },
        { status: 400 }
      );
    }

    const commerceClient = getCommerceClient();
    const data = await fetcher(commerceClient);

    return NextResponse.json({ data });
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
