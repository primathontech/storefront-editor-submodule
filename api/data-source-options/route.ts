import { NextRequest, NextResponse } from "next/server";
import { getCommerceClient } from "@/lib/data-layer";
// import { customConfig } from "@/lib/data-layer/config";

// const LIMIT = 250;

// const OPTION_FETCHERS: Record<
//     string,
//     (client: ReturnType<typeof getCommerceClient>) => Promise<any[]>
// > = {
//     collections: async (client) => {
//         const isShopify =
//             process.env.PLATFORM === "shopify" ||
//             process.env.NEXT_PUBLIC_PLATFORM === "shopify";

//         let response: any;
//         if (isShopify) {
//             response = await client.getCollections({ first: LIMIT });
//         } else {
//             // TODO: this is a temporary fetch as getCollections is not implemented yet in client custom adapters.
//             // Once it is implemented, we can remove this fetch.
//             const {
//                 merchantId,
//                 storeId,
//                 services: { product },
//             } = customConfig.config as any;

//             const url = `${product.apiBaseUrl}/collections?storeId=${storeId}&includeProducts=false&limit=${LIMIT}`;

//             const res = await fetch(url, {
//                 method: "GET",
//                 headers: {
//                     accept: "application/json",
//                     "gk-merchant-id": merchantId,
//                 },
//             });

//             const data = await res.json();
//             response = { data };
//         }

//         const rawCollections = response?.data;
//         const collections = Array.isArray(rawCollections)
//             ? rawCollections
//             : (rawCollections?.collections ?? rawCollections?.data ?? []);

//         return (collections as any[]).map((collection: any) => {
//             const value =
//                 collection.handle ?? collection.slug ?? collection.id ?? collection._id;
//             const label =
//                 collection.title ??
//                 collection.name ??
//                 collection.label ??
//                 String(value ?? "");

//             return {
//                 value,
//                 label,
//             };
//         });
//     },
//     products: async (client) => {
//         const response: any = await client.getProducts({ first: LIMIT });
//         const products = response?.data || [];
//         return products.map((product: any) => ({
//             value: product.handle,
//             label: product.title,
//         }));
//     },
// };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body as { type: string };

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    // const fetcher = OPTION_FETCHERS[type];
    // if (!fetcher) {
    //     return NextResponse.json(
    //         { error: `Unsupported type: ${type}` },
    //         { status: 400 }
    //     );
    // }

    // const commerceClient = getCommerceClient();
    // const data = await fetcher(commerceClient);

    return NextResponse.json({ data: [] });
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
