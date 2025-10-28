"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/atomic";

export interface SimpleSelectOption {
  value: string;
  label: string;
}

export interface SimpleSelectProps {
  options: SimpleSelectOption[];
  value?: string;
  onSelect?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SimpleSelect = React.forwardRef<HTMLButtonElement, SimpleSelectProps>(
  (
    {
      options,
      value,
      onSelect,
      placeholder = "Select option",
      disabled = false,
      className = "",
      size = "md",
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-6 text-xs",
      md: "h-8 text-sm",
      lg: "h-10 text-base",
    };

    return (
      <Select value={value} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className={`w-full ${sizeClasses[size]} ${className}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

SimpleSelect.displayName = "SimpleSelect";

export { SimpleSelect };
