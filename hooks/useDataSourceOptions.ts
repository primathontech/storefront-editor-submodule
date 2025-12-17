import { useState, useEffect } from "react";
import { DATA_SOURCE_TYPES } from "@/lib/page-builder/models/page-config-types";
import { SimpleSelectOption } from "../components/ui/SimpleSelect";
import { api } from "../services/api";

type DataSourceType =
  // | typeof DATA_SOURCE_TYPES.COLLECTION_BY_HANDLES
  | typeof DATA_SOURCE_TYPES.PRODUCT
  // | typeof DATA_SOURCE_TYPES.PRODUCTS_BY_HANDLES
  // | typeof DATA_SOURCE_TYPES.PRODUCT_RECOMMENDATIONS;

interface UseDataSourceOptionsResult {
  options: SimpleSelectOption[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch collections or products for data source dropdowns
 */
export function useDataSourceOptions(
  dataSourceType: DataSourceType | null
): UseDataSourceOptionsResult {
  const [options, setOptions] = useState<SimpleSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!dataSourceType) {
      setOptions([]);
      return;
    }

    // const fetchOptions = async () => {
    //   setLoading(true);
    //   setError(null);

    //   try {
    //     if (dataSourceType === DATA_SOURCE_TYPES.COLLECTION_BY_HANDLES) {
    //       const data = await api.editor.getDataSourceOptions("collections");
    //       setOptions(data);
    //     } else if (
    //       dataSourceType === DATA_SOURCE_TYPES.PRODUCT ||
    //       dataSourceType === DATA_SOURCE_TYPES.PRODUCTS_BY_HANDLES ||
    //       dataSourceType === DATA_SOURCE_TYPES.PRODUCT_RECOMMENDATIONS
    //     ) {
    //       const data = await api.editor.getDataSourceOptions("products");
    //       setOptions(data);
    //     } else {
    //       setOptions([]);
    //     }
    //   } catch (err) {
    //     setError(err instanceof Error ? err : new Error(String(err)));
    //     setOptions([]);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // fetchOptions();
  }, [dataSourceType]);

  return { options: [], loading, error };
}
