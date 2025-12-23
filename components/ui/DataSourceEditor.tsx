"use client";

import { SimpleSelect } from "./SimpleSelect";
import { useDataSourceOptions } from "../../hooks/useDataSourceOptions";
import { getDataSourceEditorConfig } from "../../config/data-source-editor";

interface DataSourceEditorProps {
  dataSource: { type: string; params: Record<string, any> } | null;
  onUpdateParams: (updates: Record<string, any>) => void;
}

export function DataSourceEditor({
  dataSource,
  onUpdateParams,
}: DataSourceEditorProps) {
  // Get config first (before early returns) to determine optionSource
  const config = dataSource ? getDataSourceEditorConfig(dataSource.type) : null;

  // Call hook unconditionally (React rules of hooks)
  // Use a safe default if config is not available
  const { options, loading } = useDataSourceOptions(
    config?.optionSource || "collections"
  );

  // Early returns after hooks
  if (!dataSource) return null;
  if (!config || config.mode === "none") return null;

  const params = dataSource.params || {};

  // Single select mode - edits a string param (e.g., handle)
  if (config.mode === "single-select") {
    const currentValue = params[config.paramKey] ?? "";

    return (
      <div className="mb-6 border-t pt-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">
          Data source
        </h4>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          {config.label}
        </label>
        {loading ? (
          <div className="text-xs text-gray-500 py-2">Loading...</div>
        ) : (
          <SimpleSelect
            options={options}
            value={currentValue}
            onSelect={(value: string) =>
              onUpdateParams({ [config.paramKey]: value })
            }
            placeholder={config.placeholder}
            size="sm"
          />
        )}
      </div>
    );
  }

  // Multi-select mode - edits an array param (e.g., handles)
  if (config.mode === "multi-select") {
    const currentValues = Array.isArray(params[config.paramKey])
      ? params[config.paramKey]
      : [];

    const handleAdd = (value: string) => {
      if (!currentValues.includes(value)) {
        onUpdateParams({
          [config.paramKey]: [...currentValues, value],
        });
      }
    };

    const handleRemove = (value: string) => {
      onUpdateParams({
        [config.paramKey]: currentValues.filter((v: string) => v !== value),
      });
    };

    return (
      <div className="mb-6 border-t pt-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">
          Data source
        </h4>
        <label className="block text-[11px] font-medium text-gray-600 mb-1">
          {config.label}
        </label>
        {loading ? (
          <div className="text-xs text-gray-500 py-2">Loading...</div>
        ) : (
          <>
            <SimpleSelect
              options={options.filter(
                (opt) => !currentValues.includes(opt.value)
              )}
              value=""
              onSelect={handleAdd}
              placeholder={config.placeholder}
              size="sm"
              className="mb-2"
            />
            {currentValues.length > 0 && (
              <div className="space-y-1 mt-2">
                {currentValues.map((value: string) => {
                  const option = options.find((opt) => opt.value === value);
                  return (
                    <div
                      key={value}
                      className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded"
                    >
                      <span>{option?.label || value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(value)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
