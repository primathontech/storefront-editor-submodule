import { DATA_SOURCE_TYPES } from "@/lib/page-builder/models/page-config-types";

/**
 * Data Source Editor Configuration
 *
 * Defines how each data source type is edited in the visual editor.
 * This is the single source of truth for editor behavior.
 */

export type DataSourceOptionSource = "collections" | "products";

/**
 * Editor UI mode - determines how the parameter is edited
 * - "single-select": dropdown for single string value (e.g., handle)
 * - "multi-select": add/remove interface for array values (e.g., handles)
 * - "none": no editor UI for this data source type
 */
export type DataSourceEditorMode = "none" | "single-select" | "multi-select";

export interface DataSourceEditorConfig {
  /** Data source type (from DATA_SOURCE_TYPES) */
  type: string;
  /** Editor UI mode - determines how the parameter is edited */
  mode: DataSourceEditorMode;
  /** Where to fetch options from (collections or products) */
  optionSource: DataSourceOptionSource;
  /** Parameter key in params object (e.g., "handle" for string, "handles" for array) */
  paramKey: string;
  /** Display label for the editor */
  label: string;
  /** Placeholder text for the select */
  placeholder: string;
}

/**
 * Registry mapping data source types to their editor configuration
 */
export const DATA_SOURCE_EDITOR_REGISTRY: Record<
  string,
  DataSourceEditorConfig
> = {
  [DATA_SOURCE_TYPES.COLLECTION]: {
    type: DATA_SOURCE_TYPES.COLLECTION,
    mode: "single-select",
    optionSource: "collections",
    paramKey: "handle",
    label: "Collection",
    placeholder: "Select collection",
  },
  [DATA_SOURCE_TYPES.PRODUCT]: {
    type: DATA_SOURCE_TYPES.PRODUCT,
    mode: "single-select",
    optionSource: "products",
    paramKey: "handle",
    label: "Product",
    placeholder: "Select product",
  },
  [DATA_SOURCE_TYPES.PRODUCTS_BY_HANDLES]: {
    type: DATA_SOURCE_TYPES.PRODUCTS_BY_HANDLES,
    mode: "multi-select",
    optionSource: "products",
    paramKey: "handles",
    label: "Products",
    placeholder: "Add product",
  },
};

/**
 * Get editor config for a data source type
 */
export function getDataSourceEditorConfig(
  type: string
): DataSourceEditorConfig | null {
  return DATA_SOURCE_EDITOR_REGISTRY[type] || null;
}
