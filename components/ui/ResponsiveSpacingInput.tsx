"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/atomic/Tabs";
import { FourSidedSpacingInput } from "./FourSidedSpacingInput";
import { Label } from "@/ui/atomic";
import { cn } from "../../utils/utils";

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
    const updateBreakpoint = (
      breakpoint: "mobile" | "tablet" | "desktop",
      updates: Partial<ResponsiveSpacingValue["mobile"]>
    ) => {
      if (!onChange) return;

      const current = value[breakpoint] || {};
      const updated = {
        ...value,
        [breakpoint]: {
          ...current,
          ...updates,
        },
      };

      onChange(updated);
    };

    const updatePadding = (
      breakpoint: "mobile" | "tablet" | "desktop",
      padding: { top: number; right: number; bottom: number; left: number }
    ) => {
      updateBreakpoint(breakpoint, { padding });
    };

    const updateMargin = (
      breakpoint: "mobile" | "tablet" | "desktop",
      margin: { top: number; right: number; bottom: number; left: number }
    ) => {
      updateBreakpoint(breakpoint, { margin });
    };

    const getPadding = (breakpoint: "mobile" | "tablet" | "desktop") => {
      const breakpointValue = value[breakpoint];
      return (
        breakpointValue?.padding || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }
      );
    };

    const getMargin = (breakpoint: "mobile" | "tablet" | "desktop") => {
      const breakpointValue = value[breakpoint];
      return (
        breakpointValue?.margin || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }
      );
    };

    const BreakpointContent = ({
      breakpoint,
    }: {
      breakpoint: "mobile" | "tablet" | "desktop";
    }) => (
      <div className="space-y-4">
        <div>
          <FourSidedSpacingInput
            label="Padding"
            value={getPadding(breakpoint)}
            onChange={(padding) => updatePadding(breakpoint, padding)}
            disabled={disabled}
          />
        </div>

        {showMargin && (
          <div>
            <FourSidedSpacingInput
              label="Margin"
              value={getMargin(breakpoint)}
              onChange={(margin) => updateMargin(breakpoint, margin)}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    );

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-xs font-semibold text-gray-800">{label}</Label>
        )}

        <Tabs defaultValue="desktop" className="w-full">
          <TabsList className="w-full flex rounded-md bg-gray-100 p-0.5 text-xs">
            <TabsTrigger
              value="desktop"
              className="flex-1 px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md text-gray-600"
            >
              Desktop
            </TabsTrigger>
            <TabsTrigger
              value="tablet"
              className="flex-1 px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md text-gray-600"
            >
              Tablet
            </TabsTrigger>
            <TabsTrigger
              value="mobile"
              className="flex-1 px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md text-gray-600"
            >
              Mobile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="desktop">
            <BreakpointContent breakpoint="desktop" />
          </TabsContent>

          <TabsContent value="tablet">
            <BreakpointContent breakpoint="tablet" />
          </TabsContent>

          <TabsContent value="mobile">
            <BreakpointContent breakpoint="mobile" />
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

ResponsiveSpacingInput.displayName = "ResponsiveSpacingInput";

export { ResponsiveSpacingInput };
