"use client";

import * as React from "react";
import { Input } from "./Input";
import { Label } from "@/ui/atomic";
import type { BaseComponentProps } from "../types";
import { cn } from "../../utils/utils";

export interface ArrayInputProps extends BaseComponentProps {
  label?: string;
  value: any[];
  onChange: (value: any[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  minItems?: number;
  maxItems?: number;
  showControls?: boolean;
}

const ArrayInput = React.forwardRef<HTMLDivElement, ArrayInputProps>(
  (
    {
      className,
      label,
      value = [],
      onChange,
      disabled = false,
      error = false,
      helperText,
      placeholder = "Enter value",
      minItems = 0,
      maxItems = 10,
      showControls = false,
      ...props
    },
    ref
  ) => {
    const safeValue = Array.isArray(value) ? value : [];

    const addItem = () => {
      if (safeValue.length >= maxItems) {
        return;
      }
      onChange([...safeValue, ""]);
    };

    const removeItem = (index: number) => {
      if (safeValue.length <= minItems) {
        return;
      }
      onChange(safeValue.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, itemValue: string) => {
      const newValue = [...safeValue];
      newValue[index] = itemValue;
      onChange(newValue);
    };

    const canAdd = safeValue.length < maxItems && !disabled;
    const canRemove = safeValue.length > minItems && !disabled;

    return (
      <div className={cn("space-y-4", className)} ref={ref} {...props}>
        {label && (
          <Label className="block text-sm font-medium text-gray-700">
            {label}
            {minItems > 0 && (
              <span className="text-gray-500 font-normal ml-1">
                (min: {minItems}, max: {maxItems})
              </span>
            )}
          </Label>
        )}

        <div className="space-y-3">
          {safeValue.map((item, index) => (
            <div
              key={index}
              className={cn(
                "border rounded-lg p-4 transition-colors",
                error
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-600">
                  Item {index + 1}
                </span>
                {showControls && canRemove && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={disabled}
                    className={cn(
                      "text-red-600 hover:text-red-800 hover:bg-red-100",
                      "border border-red-300 rounded px-2 py-1 text-xs",
                      "transition-colors duration-150",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <Input
                type="text"
                value={item || ""}
                onChange={(e) => updateItem(index, e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                error={error}
                size="sm"
              />
            </div>
          ))}
        </div>

        {showControls && canAdd && (
          <button
            type="button"
            onClick={addItem}
            disabled={disabled}
            className={cn(
              "bg-blue-500 text-white border-none rounded px-4 py-2",
              "cursor-pointer hover:bg-blue-600 transition-colors duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed text-sm",
              "flex items-center gap-2"
            )}
          >
            <span className="text-lg">+</span>
            Add {label || "Item"}
          </button>
        )}

        {helperText && (
          <p
            className={cn("text-xs", error ? "text-red-500" : "text-gray-500")}
          >
            {helperText}
          </p>
        )}

        {safeValue.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm">No items added yet.</p>
            <p className="text-xs mt-1">
              Click "Add {label || "Item"}" to get started.
            </p>
          </div>
        )}
      </div>
    );
  }
);

ArrayInput.displayName = "ArrayInput";

export { ArrayInput };
