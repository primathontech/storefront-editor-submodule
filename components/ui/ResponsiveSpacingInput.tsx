"use client";

import * as React from "react";
import { FourSidedSpacingInput } from "./FourSidedSpacingInput";
import { Label } from "@/ui/atomic";
import { cn } from "../../utils/utils";
import { useEditorState } from "../../stores/useEditorState";

export interface ResponsiveSpacingValue {
  mobile?: {
    padding?: { top: number; right: number; bottom: number; left: number };
    margin?: { top: number; right: number; bottom: number; left: number };
  };
  tablet?: {
    padding?: { top: number; right: number; bottom: number; left: number };
    margin?: { top: number; right: number; bottom: number; left: number };
  };
  desktop?: {
    padding?: { top: number; right: number; bottom: number; left: number };
    margin?: { top: number; right: number; bottom: number; left: number };
  };
}

export interface ResponsiveSpacingInputProps {
  label?: string;
  value?: ResponsiveSpacingValue;
  onChange?: (value: ResponsiveSpacingValue) => void;
  disabled?: boolean;
  className?: string;
  /** Whether to show margin inputs alongside padding (default: true) */
  showMargin?: boolean;
}

const ResponsiveSpacingInput = React.forwardRef<
  HTMLDivElement,
  ResponsiveSpacingInputProps
>(
  (
    {
      label,
      value = {},
      onChange,
      disabled = false,
      className,
      showMargin = true,
    },
    ref
  ) => {
    const device = useEditorState((state) => state.device);

    // Map device to breakpoint: desktop/fullscreen → desktop, tablet → tablet, mobile → mobile
    const breakpoint: "mobile" | "tablet" | "desktop" =
      device === "fullscreen" ? "desktop" : device;

    const currentBreakpointValue = value[breakpoint] || {};

    const handlePaddingChange = React.useCallback(
      (padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      }) => {
        if (!onChange) return;
        onChange({
          ...value,
          [breakpoint]: {
            ...currentBreakpointValue,
            padding,
          },
        });
      },
      [value, onChange, breakpoint, currentBreakpointValue]
    );

    const handleMarginChange = React.useCallback(
      (margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      }) => {
        if (!onChange) return;
        onChange({
          ...value,
          [breakpoint]: {
            ...currentBreakpointValue,
            margin,
          },
        });
      },
      [value, onChange, breakpoint, currentBreakpointValue]
    );

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-xs font-semibold text-gray-800">{label}</Label>
        )}

        <div className="space-y-4">
          <FourSidedSpacingInput
            label="Padding"
            value={
              currentBreakpointValue.padding || {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }
            }
            onChange={handlePaddingChange}
            disabled={disabled}
          />
          {showMargin && (
            <FourSidedSpacingInput
              label="Margin"
              value={
                currentBreakpointValue.margin || {
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }
              }
              onChange={handleMarginChange}
              disabled={disabled}
            />
          )}
        </div>
      </div>
    );
  }
);

ResponsiveSpacingInput.displayName = "ResponsiveSpacingInput";

export { ResponsiveSpacingInput };
