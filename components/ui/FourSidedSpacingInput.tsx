"use client";

import * as React from "react";
import { Input } from "./Input";
import { Label } from "@/ui/atomic";
import { cn } from "../../utils/utils";

export interface FourSidedSpacingInputProps {
  label?: string;
  value?: { top: number; right: number; bottom: number; left: number };
  onChange?: (value: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }) => void;
  disabled?: boolean;
  className?: string;
}

const FourSidedSpacingInput = React.forwardRef<
  HTMLDivElement,
  FourSidedSpacingInputProps
>(
  (
    {
      label,
      value = { top: 0, right: 0, bottom: 0, left: 0 },
      onChange,
      disabled = false,
      className,
    },
    ref
  ) => {
    const handleChange = (
      side: "top" | "right" | "bottom" | "left",
      newValue: number
    ) => {
      if (!onChange) return;
      const numValue = newValue;
      onChange({
        ...value,
        [side]: numValue,
      });
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-xs font-medium text-gray-600">{label}</Label>
        )}

        {/* Simple 4-field layout */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">Top</Label>
            <Input
              type="number"
              size="sm"
              value={value.top}
              onChange={(e) => {
                const val = e.target.value.replace(/^0+/, "") || "0";
                if (e.target.value !== val) {
                  e.target.value = val;
                }
                handleChange("top", Number(val));
              }}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              className="text-center"
            />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">
              Right
            </Label>
            <Input
              type="number"
              size="sm"
              value={value.right}
              onChange={(e) => {
                const val = e.target.value.replace(/^0+/, "") || "0";
                if (e.target.value !== val) {
                  e.target.value = val;
                }
                handleChange("right", Number(val));
              }}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              className="text-center"
            />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">
              Bottom
            </Label>
            <Input
              type="number"
              size="sm"
              value={value.bottom}
              onChange={(e) => {
                const val = e.target.value.replace(/^0+/, "") || "0";
                if (e.target.value !== val) {
                  e.target.value = val;
                }
                handleChange("bottom", Number(val));
              }}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              className="text-center"
            />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">Left</Label>
            <Input
              type="number"
              size="sm"
              value={value.left}
              onChange={(e) => {
                const val = e.target.value.replace(/^0+/, "") || "0";
                if (e.target.value !== val) {
                  e.target.value = val;
                }
                handleChange("left", Number(val));
              }}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              className="text-center"
            />
          </div>
        </div>
      </div>
    );
  }
);

FourSidedSpacingInput.displayName = "FourSidedSpacingInput";

export { FourSidedSpacingInput };
