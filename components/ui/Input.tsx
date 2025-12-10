"use client";

import * as React from "react";
import { cn } from "../../utils/utils";

// Base component props
export interface BaseComponentProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "ghost"
    | "outline"
    | "link";
  disabled?: boolean;
  "aria-label"?: string;
  "data-testid"?: string;
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    BaseComponentProps {
  error?: boolean;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      type = "text",
      size = "md",
      variant = "primary",
      error = false,
      helperText,
      label,
      leftIcon,
      rightIcon,
      style,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: "h-7 text-xs px-2",
      sm: "h-8 text-sm px-3",
      md: "h-10 text-base px-4",
      lg: "h-11 text-lg px-4",
      xl: "h-12 text-xl px-4",
    };

    // Special styling for checkbox inputs
    if (type === "checkbox") {
      const checkboxClasses = cn(
        "w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded",
        "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white",
        "hover:border-blue-400 hover:bg-blue-50 transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white",
        "checked:bg-blue-600 checked:border-blue-600 checked:hover:bg-blue-700",
        "checked:focus:ring-blue-500 checked:focus:ring-offset-2",
        error &&
          "border-red-500 focus:ring-red-500 checked:bg-red-600 checked:border-red-600 checked:focus:ring-red-500",
        className
      );

      return (
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              className={checkboxClasses}
              ref={ref}
              disabled={disabled}
              {...props}
            />
          </div>
          {(label || helperText) && (
            <div className="ml-2">
              {label && (
                <label
                  className={cn(
                    "text-sm font-medium text-gray-700 cursor-pointer select-none",
                    error && "text-red-600",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {label}
                </label>
              )}
              {helperText && (
                <div
                  className={cn(
                    "text-xs mt-0.5",
                    error ? "text-red-500" : "text-gray-500"
                  )}
                >
                  {helperText}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Special styling for radio inputs
    if (type === "radio") {
      const radioClasses = cn(
        "w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded-full",
        "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white",
        "hover:border-blue-400 hover:bg-blue-50 transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white",
        "checked:bg-blue-600 checked:border-blue-600 checked:hover:bg-blue-700",
        "checked:focus:ring-blue-500 checked:focus:ring-offset-2",
        error &&
          "border-red-500 focus:ring-red-500 checked:bg-red-600 checked:border-red-600 checked:focus:ring-red-500",
        className
      );

      return (
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              type="radio"
              className={radioClasses}
              ref={ref}
              disabled={disabled}
              {...props}
            />
          </div>
          {(label || helperText) && (
            <div className="ml-2">
              {label && (
                <label
                  className={cn(
                    "text-sm font-medium text-gray-700 cursor-pointer select-none",
                    error && "text-red-600",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {label}
                </label>
              )}
              {helperText && (
                <div
                  className={cn(
                    "text-xs mt-0.5",
                    error ? "text-red-500" : "text-gray-500"
                  )}
                >
                  {helperText}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Default styling for other input types
    const inputClasses = cn(
      "w-full font-sans bg-white text-gray-900 border border-gray-300 rounded-md transition-all duration-150 ease-in-out",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
      "hover:border-gray-400",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
      error && "border-red-500 focus:ring-red-500 focus:border-red-500",
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      sizeClasses[size],
      className
    );

    const labelClasses = cn(
      "block text-sm font-medium text-gray-700 mb-1",
      error && "text-red-600"
    );

    const helperTextClasses = cn(
      "block text-xs mt-1",
      error ? "text-red-500" : "text-gray-500"
    );

    const iconClasses = cn(
      "absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none",
      leftIcon && "left-3",
      rightIcon && "right-3"
    );

    return (
      <div className="relative">
        {label && <label className={labelClasses}>{label}</label>}

        <div className="relative">
          {leftIcon && (
            <span className={cn(iconClasses, "left-3")}>{leftIcon}</span>
          )}

          <input
            type={type}
            className={inputClasses}
            ref={ref}
            disabled={disabled}
            {...props}
          />

          {rightIcon && (
            <span className={cn(iconClasses, "right-3")}>{rightIcon}</span>
          )}
        </div>

        {helperText && <span className={helperTextClasses}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
