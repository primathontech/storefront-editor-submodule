"use client";

import * as React from "react";
import { cn } from "../../utils/utils";

export interface SpacingInputProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  className?: string;
}

const SpacingInput = React.forwardRef<HTMLInputElement, SpacingInputProps>(
  (
    {
      label,
      value = 0,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      error = false,
      helperText,
      className,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (!isNaN(newValue) && onChange) {
        onChange(newValue);
      }
    };

    const inputId = React.useId();

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-gray-600"
          >
            {label}
          </label>
        )}

        <div className="flex items-center space-x-2">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              "flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              error && "ring-2 ring-red-500",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            {...props}
          />

          <input
            id={inputId}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            aria-label={`${label || "Value"} in pixels`}
            className={cn(
              "w-16 px-2 py-1 text-sm border rounded",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              error ? "border-red-500" : "border-gray-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />

          <span className="text-xs text-gray-500">px</span>
        </div>

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

SpacingInput.displayName = "SpacingInput";

export { SpacingInput };
