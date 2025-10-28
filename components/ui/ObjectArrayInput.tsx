"use client";

import * as React from "react";
import { Input } from "./Input";
import { Label } from "@/ui/atomic";
import type { BaseComponentProps } from "../types";
import { cn } from "../../utils/utils";

export interface ObjectArrayInputProps extends BaseComponentProps {
  label?: string;
  value: any[];
  onChange: (value: any[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fields: string[];
  showControls?: boolean;
}

const ObjectArrayInput = React.forwardRef<
  HTMLDivElement,
  ObjectArrayInputProps
>(
  (
    {
      className,
      label,
      value = [],
      onChange,
      disabled = false,
      error = false,
      helperText,
      fields,
      showControls = true,
      ...props
    },
    ref
  ) => {
    // Ensure value is always an array
    const safeValue = Array.isArray(value) ? value : [];

    const addItem = () => {
      const newItem: any = {};
      fields.forEach((fieldName) => {
        newItem[fieldName] = "";
      });
      onChange([...safeValue, newItem]);
    };

    const removeItem = (index: number) => {
      onChange(safeValue.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, fieldName: string, fieldValue: any) => {
      const newValue = [...safeValue];
      newValue[index] = { ...newValue[index], [fieldName]: fieldValue };
      onChange(newValue);
    };

    return (
      <div className={cn("space-y-4", className)} ref={ref} {...props}>
        {label && (
          <Label className="block text-sm font-medium text-gray-700">
            {label}
          </Label>
        )}

        <div className="space-y-3">
          {safeValue.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-600">
                  Item {index + 1}
                </span>
                {showControls && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={disabled}
                    className="bg-red-500 text-white border-none rounded px-2 py-1 text-xs cursor-pointer hover:bg-red-600 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {fields.map((fieldName) => (
                  <div key={fieldName}>
                    <Label className="block text-xs font-medium mb-1 text-gray-500">
                      {fieldName}
                    </Label>
                    <Input
                      type="text"
                      size="sm"
                      value={item?.[fieldName] || ""}
                      onChange={(e) =>
                        updateItem(index, fieldName, e.target.value)
                      }
                      disabled={disabled}
                      placeholder={`Enter ${fieldName}`}
                      error={error}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showControls && (
          <button
            type="button"
            onClick={addItem}
            disabled={disabled}
            className="bg-blue-500 text-white border-none rounded px-4 py-2 cursor-pointer hover:bg-blue-600 disabled:cursor-not-allowed text-sm"
          >
            + Add {label || "Item"}
          </button>
        )}

        {helperText && (
          <p
            className={cn("text-xs", error ? "text-red-500" : "text-gray-500")}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ObjectArrayInput.displayName = "ObjectArrayInput";

export { ObjectArrayInput };
