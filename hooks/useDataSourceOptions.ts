import { useState, useEffect } from "react";
import { SimpleSelectOption } from "../components/ui/SimpleSelect";
import { api } from "../services/api";
import { DataSourceOptionSource } from "../config/data-source-editor";

interface UseDataSourceOptionsResult {
  options: SimpleSelectOption[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch options for data source dropdowns
 * @param optionSource - "collections" or "products" (from registry config)
 */
export function useDataSourceOptions(
  optionSource: DataSourceOptionSource | null
): UseDataSourceOptionsResult {
  const [options, setOptions] = useState<SimpleSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!optionSource) {
      setOptions([]);
      return;
    }

    const fetchOptions = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.editor.getDataSourceOptions(optionSource);
        setOptions(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [optionSource]);

  return { options, loading, error };
}
