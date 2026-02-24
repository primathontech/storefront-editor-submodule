"use client";

import { TranslationService } from "@/lib/i18n/translation-service";
import { Label } from "@/ui/atomic";
import * as React from "react";
import {
  translationUtils,
  useDualTranslationStore,
} from "../../stores/dualTranslationStore";
import { cn } from "../../utils/utils";
import type { BaseComponentProps } from "../types";
import { ArrayInput } from "./ArrayInput";
import { Input as DesignInput, Switch } from "./design-system";
import styles from "./DynamicForm.module.css";
import { FAQInput } from "./FAQInput";
import { HtmlInput } from "./HtmlInput";
import { ImageInput } from "./ImageInput";
import { Input } from "./Input";
import { ObjectArrayInput } from "./ObjectArrayInput";
import { ResponsiveSpacingInput } from "./ResponsiveSpacingInput";
import { RichTextInput } from "./RichTextInput";
import { SimpleSelect } from "./SimpleSelect";

export interface FormFieldSchema {
  type:
    | "text"
    | "number"
    | "select"
    | "boolean"
    | "spacing"
    | "image"
    | "faq"
    | "richtext"
    | "objectArray"
    | "array"
    | "html";
  label?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  fields?: string[];
  default?: any;
}

export interface FormSchema {
  [key: string]: FormFieldSchema;
}

export interface DynamicFormProps extends BaseComponentProps {
  /**
   * Custom styles
   */
  style?: React.CSSProperties;
  /**
   * The form schema defining all fields
   */
  schema: FormSchema;

  /**
   * Current form values
   */
  values: Record<string, any>;

  /**
   * Callback when any field value changes
   */
  onUpdate: (key: string, value: any) => void;

  /**
   * Whether the form is disabled
   */
  disabled?: boolean;

  /**
   * Error states for fields
   */
  errors?: Record<string, boolean>;

  /**
   * Helper texts for fields
   */
  helperTexts?: Record<string, string>;

  /**
   * Translation service for handling translation keys
   */
  translationService?: TranslationService | null;

  /**
   * Section ID for HTML validation error tracking
   */
  sectionId?: string;
}

// Translation utilities hook
const useTranslationUtils = (translationService: TranslationService | null) => {
  const { updateTranslation } = useDualTranslationStore();

  const translateValue = (value: any): any =>
    translationService ? translationService.translateObject(value) : value;

  const handleTranslationChange = (originalValue: any, newValue: any): any => {
    if (translationUtils.isTranslationKey(originalValue)) {
      updateTranslation(
        translationUtils.getTranslationPath(originalValue),
        newValue
      );
      return originalValue; // Keep t: reference
    }
    return newValue;
  };

  return { translateValue, handleTranslationChange };
};

const DynamicForm = React.forwardRef<HTMLDivElement, DynamicFormProps>(
  (
    {
      className,
      schema,
      values,
      onUpdate,
      disabled = false,
      errors = {},
      helperTexts = {},
      size = "md",
      variant = "primary",
      style,
      translationService,
      sectionId,
      ...props
    },
    ref
  ) => {
    const { translateValue, handleTranslationChange } = useTranslationUtils(
      translationService || null
    );

    const hasHtmlField = React.useMemo(
      () => Object.values(schema).some((field) => field.type === "html"),
      [schema]
    );

    const renderField = (key: string, fieldSchema: FormFieldSchema) => {
      const value = values[key];
      const fieldError = errors[key] || fieldSchema.error;
      const fieldHelperText = helperTexts[key] || fieldSchema.helperText;
      const fieldDisabled = disabled || fieldSchema.disabled;
      const fieldLabel = fieldSchema.label;

      const handleChange = (newValue: any) => {
        const finalValue = handleTranslationChange(value, newValue);
        onUpdate(key, finalValue);
      };

      switch (fieldSchema.type) {
        case "select":
          return (
            <FieldWrapper
              fieldHelperText={fieldHelperText}
              fieldError={fieldError}
            >
              <Label className="block text-xs font-medium mb-1 text-gray-600">
                {fieldLabel}
              </Label>
              <SimpleSelect
                options={fieldSchema.options || []}
                value={value}
                onSelect={handleChange}
                disabled={fieldDisabled}
                size="sm"
              />
            </FieldWrapper>
          );

        case "number":
          return (
            <FieldWrapper
              fieldHelperText={fieldHelperText}
              fieldError={fieldError}
            >
              <Label className="block text-xs font-medium mb-1 text-gray-600">
                {fieldLabel}
              </Label>
              <Input
                type="number"
                size="sm"
                value={value}
                onChange={(e) => handleChange(Number(e.target.value))}
                min={fieldSchema.min}
                max={fieldSchema.max}
                step={fieldSchema.step}
                disabled={fieldDisabled}
                error={fieldError}
                placeholder={fieldSchema.placeholder}
              />
            </FieldWrapper>
          );

        case "spacing":
          return (
            <ResponsiveSpacingInput
              label={fieldLabel}
              value={value || {}}
              onChange={handleChange}
              disabled={fieldDisabled}
            />
          );

        case "text":
          const displayValue = translateValue(value);

          const handleTextChange = (e: any) => {
            const finalValue = handleTranslationChange(value, e.target.value);
            onUpdate(key, finalValue);
          };

          return (
            <FieldWrapper fieldHelperText={undefined} fieldError={fieldError}>
              <DesignInput
                label={fieldLabel}
                type="text"
                size="md"
                value={displayValue ?? ""}
                onChange={handleTextChange}
                disabled={fieldDisabled}
                placeholder={fieldSchema.placeholder}
                fullWidth
                helperText={!fieldError ? fieldHelperText : undefined}
                error={fieldError ? fieldHelperText : undefined}
              />
            </FieldWrapper>
          );

        case "boolean":
          return (
            <FieldWrapper fieldHelperText={undefined} fieldError={fieldError}>
              <Switch
                checked={value || false}
                onChange={handleChange}
                disabled={fieldDisabled}
                label={fieldLabel}
                labelPosition="left"
                size="sm"
                helperText={!fieldError ? fieldHelperText : undefined}
                error={fieldError ? fieldHelperText : undefined}
              />
            </FieldWrapper>
          );

        case "image":
          return (
            <ImageInput
              label={fieldLabel}
              value={value || { src: "", alt: "" }}
              onChange={handleChange}
              disabled={fieldDisabled}
            />
          );

        case "faq":
          // If entire FAQ is a translation key array, resolve and save as one
          if (typeof value === "string" && value.startsWith("t:")) {
            const actualFaqItems = translateValue(value) || [];

            const handleFaqTranslationChange = (newItems: any[]) => {
              const finalValue = handleTranslationChange(value, newItems);
              onUpdate(key, finalValue);
            };

            return (
              <FAQInput
                label={fieldLabel}
                value={actualFaqItems}
                onChange={handleFaqTranslationChange}
                disabled={fieldDisabled}
                showControls={true}
              />
            );
          }

          // Legacy: each field may be a translation key
          const originalFaqItems = Array.isArray(value) ? value : [];
          const faqDisplayItems = originalFaqItems.map((item: any) => ({
            question: translateValue(item?.question) || "",
            answer: translateValue(item?.answer) || "",
          }));

          const handleFaqChange = (newItems: any[]) => {
            const updatedItems = newItems.map((newItem: any, idx: number) => {
              const origItem = originalFaqItems[idx];
              return {
                question: origItem
                  ? handleTranslationChange(
                      origItem?.question,
                      newItem?.question
                    )
                  : newItem?.question,
                answer: origItem
                  ? handleTranslationChange(origItem?.answer, newItem?.answer)
                  : newItem?.answer,
              };
            });
            onUpdate(key, updatedItems);
          };

          return (
            <FAQInput
              label={fieldLabel}
              value={faqDisplayItems}
              onChange={handleFaqChange}
              disabled={fieldDisabled}
              showControls={true}
            />
          );

        case "richtext":
          const richTextDisplay = translateValue(value) || "";
          const handleRichTextChange = (newValue: string) => {
            const finalValue = handleTranslationChange(value, newValue);
            onUpdate(key, finalValue);
          };

          return (
            <RichTextInput
              label={fieldLabel}
              value={richTextDisplay}
              onChange={handleRichTextChange}
              disabled={fieldDisabled}
              placeholder={fieldSchema.placeholder}
            />
          );

        case "html":
          const htmlDisplay = translateValue(value) || "";
          const handleHtmlChange = (newValue: string) => {
            const finalValue = handleTranslationChange(value, newValue);
            onUpdate(key, finalValue);
          };

          return (
            <HtmlInput
              value={htmlDisplay}
              onChange={handleHtmlChange}
              disabled={fieldDisabled}
              placeholder={fieldSchema.placeholder}
              sectionId={sectionId}
            />
          );

        case "objectArray":
          // Check if this is a translation key array (value is a string starting with "t:")
          const isTranslationKeyArray =
            typeof value === "string" && value.startsWith("t:");

          if (isTranslationKeyArray) {
            // Handle translation key array - resolve with translateValue for consistency
            const actualArray = translateValue(value) || [];

            const handleTranslationArrayChange = (newItems: any[]) => {
              // Use existing translation change logic
              const finalValue = handleTranslationChange(value, newItems);
              onUpdate(key, finalValue);
            };

            return (
              <ObjectArrayInput
                label={fieldLabel}
                value={actualArray}
                onChange={handleTranslationArrayChange}
                disabled={fieldDisabled}
                error={fieldError}
                helperText={fieldHelperText}
                fields={fieldSchema.fields || []}
                showControls={true}
              />
            );
          } else {
            // Legacy: Handle regular object array (existing logic)
            const originalObjectArray = Array.isArray(value) ? value : [];
            const fields = fieldSchema.fields || [];
            const objectArrayDisplay = originalObjectArray.map((item: any) => {
              const displayItem: any = {};
              fields.forEach((fieldName) => {
                displayItem[fieldName] = translateValue(item?.[fieldName]);
              });
              return displayItem;
            });

            const handleObjectArrayChange = (newItems: any[]) => {
              const updatedItems = newItems.map((newItem: any, idx: number) => {
                const origItem = originalObjectArray[idx];
                const updatedItem: any = {};
                fields.forEach((fieldName) => {
                  updatedItem[fieldName] = origItem
                    ? handleTranslationChange(
                        origItem[fieldName],
                        newItem[fieldName]
                      )
                    : newItem[fieldName];
                });
                return updatedItem;
              });
              onUpdate(key, updatedItems);
            };

            return (
              <ObjectArrayInput
                label={fieldLabel}
                value={objectArrayDisplay}
                onChange={handleObjectArrayChange}
                disabled={fieldDisabled}
                error={fieldError}
                helperText={fieldHelperText}
                fields={fields}
                showControls={true}
              />
            );
          }

        case "array":
          // Translation-key array: manage whole array
          if (typeof value === "string" && value.startsWith("t:")) {
            const actualArray = translateValue(value) || [];

            const handleArrayTranslationChange = (newItems: any[]) => {
              const finalValue = handleTranslationChange(value, newItems);
              onUpdate(key, finalValue);
            };

            return (
              <ArrayInput
                label={fieldLabel}
                value={actualArray}
                onChange={handleArrayTranslationChange}
                disabled={fieldDisabled}
                error={fieldError}
                helperText={fieldHelperText}
                showControls={true}
              />
            );
          }

          // Legacy: simple array handling
          const originalArray = Array.isArray(value) ? value : [];
          const arrayDisplay = originalArray.map((item) =>
            translateValue(item)
          );
          const handleArrayChange = (newItems: any[]) => {
            const updatedItems = newItems.map((newItem: any, idx: number) => {
              const origItem = originalArray[idx];
              return origItem
                ? handleTranslationChange(origItem, newItem)
                : newItem;
            });
            onUpdate(key, updatedItems);
          };

          return (
            <ArrayInput
              label={fieldLabel}
              value={arrayDisplay}
              onChange={handleArrayChange}
              disabled={fieldDisabled}
              error={fieldError}
              helperText={fieldHelperText}
              showControls={true}
            />
          );

        default:
          return null;
      }
    };

    return (
      <div
        className={cn(
          "space-y-3",
          hasHtmlField && "flex flex-col flex-1 min-h-0",
          className
        )}
        ref={ref}
        style={style}
        {...props}
      >
        {Object.entries(schema).map(([key, fieldSchema]) => (
          <React.Fragment key={key}>
            {renderField(key, fieldSchema)}
          </React.Fragment>
        ))}
      </div>
    );
  }
);

// FieldWrapper component moved outside to prevent recreation on every render
const FieldWrapper = ({
  children,
  fieldHelperText,
  fieldError,
}: {
  children: React.ReactNode;
  fieldHelperText?: string;
  fieldError?: boolean;
}) => (
  <div className={styles.fieldWrapper}>
    {children}
    {fieldHelperText && (
      <p
        className={cn(
          styles.helperText,
          fieldError ? styles.helperTextError : styles.helperTextNormal
        )}
      >
        {fieldHelperText}
      </p>
    )}
  </div>
);

DynamicForm.displayName = "DynamicForm";

export { DynamicForm };
