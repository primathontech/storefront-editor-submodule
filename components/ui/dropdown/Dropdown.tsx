"use client";

import * as React from "react";
import { clsx } from "clsx";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownOptionGroup {
  label: string;
  options: DropdownOption[];
}

export interface DropdownProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  /**
   * Dropdown variant
   */
  variant?: "default" | "outline" | "ghost";
  /**
   * Dropdown size
   */
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * Label text displayed above the dropdown
   */
  label?: string;
  /**
   * Helper text displayed below the dropdown
   */
  helperText?: string;
  /**
   * Error message (shows error state)
   */
  error?: string;
  /**
   * Options array (flat list)
   */
  options?: DropdownOption[];
  /**
   * Option groups (for grouped options)
   */
  groups?: DropdownOptionGroup[];
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Left icon (displayed before the select)
   */
  leftIcon?: React.ReactNode;
  /**
   * Right icon (displayed after the select, replaces default chevron)
   */
  rightIcon?: React.ReactNode;
  /**
   * Show default chevron icon
   */
  showChevron?: boolean;
  /**
   * Full width dropdown
   */
  fullWidth?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Container className (for label + dropdown wrapper)
   */
  containerClassName?: string;
}

const Dropdown = React.forwardRef<HTMLSelectElement, DropdownProps>(
  (
    {
      variant = "default",
      size = "md",
      label,
      helperText,
      error,
      options = [],
      groups = [],
      placeholder,
      leftIcon,
      rightIcon,
      showChevron = true,
      fullWidth = false,
      className,
      containerClassName,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const isDisabled = disabled;

    // Determine if we should use groups or flat options
    const hasGroups = groups.length > 0;
    const hasOptions = options.length > 0 || React.Children.count(children) > 0;

    const selectClasses = clsx(
      styles.select,
      styles[`select-${size}`],
      styles[`select-${variant}`],
      hasError && styles["select-error"],
      isDisabled && styles["select-disabled"],
      leftIcon && styles["select-with-left-icon"],
      (rightIcon || showChevron) && styles["select-with-right-icon"],
      fullWidth && styles["select-full-width"],
      className
    );

    const containerClasses = clsx(
      styles.container,
      fullWidth && styles["container-full-width"],
      containerClassName
    );

    return (
      <div className={containerClasses}>
        {label && (
          <label
            htmlFor={props.id}
            className={clsx(
              styles.label,
              styles[`label-${size}`],
              hasError && styles["label-error"]
            )}
          >
            {label}
          </label>
        )}

        <div className={styles["select-wrapper"]}>
          {leftIcon && (
            <span className={styles["select-icon-left"]} aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            className={selectClasses}
            disabled={isDisabled}
            aria-invalid={hasError}
            aria-describedby={
              error || helperText
                ? `${props.id || "dropdown"}-${error ? "error" : "helper"}`
                : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}

            {/* Render option groups if provided */}
            {hasGroups &&
              groups.map((group, groupIndex) => (
                <optgroup key={groupIndex} label={group.label}>
                  {group.options.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}

            {/* Render flat options if provided */}
            {!hasGroups &&
              hasOptions &&
              options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}

            {/* Render children if provided (for custom option elements) */}
            {!hasGroups && !hasOptions && children}
          </select>

          {(rightIcon || showChevron) && (
            <span className={styles["select-icon-right"]} aria-hidden="true">
              {rightIcon || (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.chevron}
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          )}
        </div>

        {(error || helperText) && (
          <div
            id={`${props.id || "dropdown"}-${error ? "error" : "helper"}`}
            className={clsx(
              styles["helper-text"],
              styles[`helper-text-${size}`],
              hasError && styles["helper-text-error"]
            )}
          >
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = "Dropdown";

export { Dropdown };

