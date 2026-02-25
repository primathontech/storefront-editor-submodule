"use client";

import { TranslationProvider } from "@/lib/i18n/translation-context";
import { Locale } from "@/lib/i18n/types";
import React, { useEffect, useState } from "react";
import { useDualTranslationStore } from "../../stores/dualTranslationStore";
import { ArrayInput } from "../ui/ArrayInput";
import { Input as DesignInput } from "../ui/design-system";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import LazyTemplateLoader from "../ui/LazyTemplateLoader";
import { ObjectArrayInput } from "../ui/ObjectArrayInput";
import { RichTextInput } from "../ui/RichTextInput";
import styles from "./TranslationEditor.module.css";

interface TranslationEditorProps {
  templateMeta?: any;
  themeId?: string;
}

const TranslationEditor: React.FC<TranslationEditorProps> = ({
  templateMeta,
  themeId,
}) => {
  const {
    translations,
    templateTranslations,
    language,
    isLoading,
    error,
    hasUnsavedChanges,
    setLanguage,
    updateTranslation,
    getTranslations,
  } = useDualTranslationStore();

  const [focusedPath, setFocusedPath] = useState<string | null>(null);

  // Load translations when component mounts or dependencies change
  useEffect(() => {
    if (!templateMeta?.id || !themeId) {
      return;
    }
    getTranslations(themeId, templateMeta.id, language);
  }, [templateMeta?.id, themeId, language]);

  // Scroll focused input into view
  useEffect(() => {
    if (!focusedPath) {
      return;
    }

    // Find the element with matching sectionKey
    const elements = document.querySelectorAll("[data-section-key]");
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const sectionKey = element.getAttribute("data-section-key");
      if (
        sectionKey === focusedPath ||
        sectionKey?.endsWith(`.${focusedPath}`)
      ) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        break;
      }
    }
  }, [focusedPath]);

  const handleChange = (path: string[], value: any) => {
    updateTranslation(path, value);
  };

  // Flatten nested object into array of { path, value, key, type? } objects
  // Arrays are returned as special entries with type information
  const flattenTranslations = (
    obj: any,
    path: string[] = []
  ): Array<{
    path: string[];
    value: any;
    key: string;
    type?: "array" | "objectArray";
    fields?: string[];
  }> => {
    if (!obj || typeof obj !== "object") {
      return [];
    }

    const result: Array<{
      path: string[];
      value: any;
      key: string;
      type?: "array" | "objectArray";
      fields?: string[];
    }> = [];

    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = [...path, key];

      if (Array.isArray(value)) {
        // Detect array type
        if (
          value.length > 0 &&
          typeof value[0] === "object" &&
          !Array.isArray(value[0])
        ) {
          // Object array - infer fields from first item
          const fields = Object.keys(value[0]);
          result.push({
            path: currentPath,
            value,
            key,
            type: "objectArray",
            fields,
          });
        } else {
          // Simple array
          result.push({
            path: currentPath,
            value,
            key,
            type: "array",
          });
        }
      } else if (typeof value === "object" && value !== null) {
        // Recursively flatten nested objects
        result.push(...flattenTranslations(value, currentPath));
      } else {
        // Add leaf node
        result.push({ path: currentPath, value, key });
      }
    });

    return result;
  };

  const renderFlatInputs = () => {
    if (!templateTranslations) {
      return null;
    }

    const templateData = translations[templateMeta.id];
    if (!templateData) {
      return null;
    }

    const flatTranslations = flattenTranslations({
      [templateMeta.id]: templateData,
    });

    return flatTranslations.map(({ path, value, key, type, fields }) => {
      const sectionKey = path.join(".");
      const isImageUrl = key.endsWith("__image");
      const isRichText = key.endsWith("__rich");

      // Check if focusedPath matches sectionKey (sectionKey includes template ID prefix)
      const isFocused =
        focusedPath === sectionKey || sectionKey.endsWith(`.${focusedPath}`);

      // Create a human-readable label from the path
      const label = path.slice(-1)[0] || key;

      // Handle array types
      if (type === "array") {
        const arrayValue = Array.isArray(value) ? value : [];
        return (
          <div
            key={sectionKey}
            data-section-key={sectionKey}
            className={styles.sectionArray}
            style={{
              boxShadow: isFocused ? "0 0 0 2px #3b82f6" : undefined,
            }}
            onFocus={() => setFocusedPath(sectionKey)}
            onBlur={() => setFocusedPath(null)}
            tabIndex={0}
          >
            <ArrayInput
              value={arrayValue}
              onChange={(newValue) => handleChange(path, newValue)}
              showControls={true}
            />
          </div>
        );
      }

      if (type === "objectArray") {
        const arrayValue = Array.isArray(value) ? value : [];
        const inferredFields =
          fields || (arrayValue.length > 0 ? Object.keys(arrayValue[0]) : []);
        return (
          <div
            key={sectionKey}
            data-section-key={sectionKey}
            className={styles.sectionObjectArray}
            style={{
              boxShadow: isFocused ? "0 0 0 2px #3b82f6" : undefined,
            }}
            onFocus={() => setFocusedPath(sectionKey)}
            onBlur={() => setFocusedPath(null)}
            tabIndex={0}
          >
            <ObjectArrayInput
              value={arrayValue}
              onChange={(newValue) => handleChange(path, newValue)}
              fields={inferredFields}
              showControls={true}
            />
          </div>
        );
      }

      // Handle regular flat inputs
      return (
        <div key={sectionKey} className={styles.inputRow}>
          <div className={styles.inputContainer}>
            {isRichText ? (
              <RichTextInput
                key={sectionKey}
                value={String(value)}
                onChange={(newValue) => handleChange(path, newValue)}
                label={label}
                placeholder={`Enter content for ${label}`}
              />
            ) : (
              <FieldWrapper>
                <DesignInput
                  // label={label}
                  type="text"
                  size="md"
                  value={String(value)}
                  onChange={(e) => handleChange(path, e.target.value)}
                  onFocus={() => setFocusedPath(sectionKey)}
                  onBlur={() => setFocusedPath(null)}
                  placeholder={`Enter value for ${label}`}
                  fullWidth
                  aria-label={`Value for ${label}`}
                  className={styles.translationInput}
                />
              </FieldWrapper>
            )}

            {/* Image preview for image URLs */}
            {isImageUrl && Boolean(value) && (
              <div className={styles.imagePreview}>
                <div className={styles.imagePreviewTitle}>Image Preview:</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={String(value)}
                  alt={`Preview of ${label}`}
                  className={styles.imagePreviewImg}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = "none";
                    const nextElement =
                      target.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = "block";
                    }
                  }}
                />
                <div className={styles.imagePreviewError}>
                  Failed to load image
                </div>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className={styles.statusMessage}>
        <p className={styles.statusText}>Loading translation…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.statusMessage}>
        <p className={styles.statusText}>
          Something went wrong while loading translations.
        </p>
      </div>
    );
  }

  if (!templateMeta || !themeId) {
    return (
      <div className={styles.statusMessage}>
        <p className={styles.statusText}>
          No template or theme selected. Please select both from the dropdown
          above.
        </p>
      </div>
    );
  }

  const supportedLanguages = templateMeta?.supportedLanguages || ["en"];
  const showLanguageSwitcher =
    Array.isArray(supportedLanguages) && supportedLanguages.length > 1;

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          {(showLanguageSwitcher || hasUnsavedChanges) && (
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                {hasUnsavedChanges && (
                  <div className={styles.unsavedBadge}>• Unsaved changes</div>
                )}
                {showLanguageSwitcher && (
                  <LanguageSwitcher
                    supportedLanguages={supportedLanguages}
                    selectedLang={language}
                    onSelectLang={setLanguage}
                  />
                )}
              </div>
            </div>
          )}

          <div className={styles.list}>
            {translations && Object.keys(translations).length === 0 && (
              <div className={styles.emptyState}>No translations found.</div>
            )}
            {renderFlatInputs()}
          </div>
        </div>

        <div className={styles.previewPane}>
          <TranslationProvider
            locale={language as Locale}
            translations={translations}
            isEditor={true}
            focusedPath={focusedPath}
            setFocusedPath={setFocusedPath}
          >
            <LazyTemplateLoader
              themeId={themeId}
              templateId={templateMeta.id}
            />
          </TranslationProvider>
        </div>
      </div>
    </div>
  );
};

const FieldWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.fieldWrapper}>{children}</div>
);

export default TranslationEditor;
