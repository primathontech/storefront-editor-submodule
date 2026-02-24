"use client";

import * as React from "react";
import { cn } from "../../utils/utils";
import type { BaseComponentProps } from "../types";
import { Input } from "./design-system";
import { TrashRedIcon } from "./icons/TrashIcon";
import styles from "./ObjectArrayInput.module.css";

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
      <div className={cn(styles.root, className)} ref={ref} {...props}>
        {label && <span className={styles.label}>{label}</span>}

        <div className={styles.items}>
          {safeValue.map((item, index) => (
            <div key={index} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>Item {index + 1}</span>
                {showControls && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={disabled}
                    className={styles.removeButton}
                  >
                    <TrashRedIcon />
                  </button>
                )}
              </div>

              <div className={styles.fields}>
                {fields.map((fieldName) => (
                  <div key={fieldName}>
                    <Input
                      label={fieldName}
                      type="text"
                      size="md"
                      value={item?.[fieldName] || ""}
                      onChange={(e) =>
                        updateItem(index, fieldName, e.target.value)
                      }
                      disabled={disabled}
                      placeholder={`Enter ${fieldName}`}
                      fullWidth
                      className={error ? styles.inputError : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showControls && (
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

        {helperText && (
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

ObjectArrayInput.displayName = "ObjectArrayInput";

export { ObjectArrayInput };
