"use client";

import * as React from "react";
import { Input } from "./design-system";
import type { BaseComponentProps } from "../types";
import { cn } from "../../utils/utils";
import { TrashRedIcon } from "./icons/TrashIcon";
import styles from "./ArrayInput.module.css";

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
      <div className={cn(styles.root, className)} ref={ref} {...props}>
        {label && (
          <span className={styles.label}>
            {label}
            {minItems > 0 && (
              <span className={styles.labelMeta}>
                (min: {minItems}, max: {maxItems})
              </span>
            )}
          </span>
        )}

        <div className={styles.items}>
          {safeValue.map((item, index) => (
            <div
              key={index}
              className={cn(styles.itemCard, error && styles.itemCardError)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>Item {index + 1}</span>
                {showControls && canRemove && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={disabled}
                    className={styles.removeButton}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <TrashRedIcon />
                  </button>
                )}
              </div>

              <div className={styles.fields}>
                <Input
                  type="text"
                  labelVariant="subtle"
                  size="md"
                  value={item || ""}
                  onChange={(e) => updateItem(index, e.target.value)}
                  disabled={disabled}
                  placeholder={placeholder}
                  fullWidth
                  helperText={!error ? helperText : undefined}
                  error={error ? helperText : undefined}
                />
              </div>
            </div>
          ))}
        </div>

        {showControls && canAdd && (
          <div className={styles.addRow}>
            <button
              type="button"
              onClick={addItem}
              disabled={disabled}
              className={styles.addButton}
            >
              + Add {label || "Item"}
            </button>
          </div>
        )}

        {helperText && safeValue.length === 0 && (
          <p
            className={cn(
              styles.helperText,
              error ? styles.helperTextError : styles.helperTextNormal
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ArrayInput.displayName = "ArrayInput";

export { ArrayInput };
