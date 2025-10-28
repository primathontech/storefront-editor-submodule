"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/ui/atomic";
import { RichTextInput } from "../ui/RichTextInput";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import { useDualTranslationStore } from "../../stores/dualTranslationStore";
import { Locale } from "@/lib/i18n/types";
import { TranslationProvider } from "@/lib/i18n/translation-context";
import LazyTemplateLoader from "../ui/LazyTemplateLoader";

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
    if (!templateMeta?.id || !themeId) return;
    getTranslations(themeId, templateMeta.id, language);
  }, [templateMeta?.id, themeId, language]);

  const handleChange = (path: string[], value: string) => {
    updateTranslation(path, value);
  };

  // Flatten nested object into array of { path, value, key } objects
  const flattenTranslations = (
    obj: any,
    path: string[] = []
  ): Array<{ path: string[]; value: any; key: string }> => {
    if (!obj || typeof obj !== "object") return [];

    const result: Array<{ path: string[]; value: any; key: string }> = [];

    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = [...path, key];

      if (typeof value === "object" && value !== null) {
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
    if (!templateTranslations) return null;

    const flatTranslations = flattenTranslations({
      [templateMeta.id]: translations[templateMeta.id],
    });

    return flatTranslations.map(({ path, value, key }, index) => {
      const sectionKey = path.join(".");
      const isImageUrl = key.endsWith("__image");
      const isRichText = key.endsWith("__rich");

      // Create a human-readable label from the path
      const label = path.slice(-1)[0] || key;

      return (
        <div
          key={sectionKey}
          className="mb-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="flex-grow">
              {isRichText ? (
                <RichTextInput
                  value={String(value)}
                  onChange={(newValue) => handleChange(path, newValue)}
                  label={label}
                  placeholder={`Enter content for ${label}`}
                />
              ) : (
                <Input
                  className="w-full focus:ring-2 focus:ring-blue-200"
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    height: "1.5rem",
                    padding: "1rem",
                    fontSize: "1rem",
                    boxShadow:
                      focusedPath === sectionKey
                        ? "0 0 0 2px #3b82f6"
                        : undefined,
                  }}
                  value={String(value)}
                  onChange={(e) => handleChange(path, e.target.value)}
                  onFocus={() => setFocusedPath(sectionKey)}
                  onBlur={() => setFocusedPath(null)}
                  placeholder={`Enter value for ${label}`}
                  aria-label={`Value for ${label}`}
                />
              )}

              {/* Image preview for image URLs */}
              {isImageUrl && Boolean(value) && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-2">
                    Image Preview:
                  </div>
                  <img
                    src={String(value)}
                    alt={`Preview of ${label}`}
                    className="max-w-full h-20 object-contain rounded border"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = "none";
                      const nextElement =
                        target.nextElementSibling as HTMLElement;
                      if (nextElement) nextElement.style.display = "block";
                    }}
                  />
                  <div className="hidden text-sm text-red-500">
                    Failed to load image
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  if (isLoading) return <div>Loading translation...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!templateMeta || !themeId)
    return (
      <div>
        No template or theme selected. Please select both from the dropdown
        above.
      </div>
    );

  const supportedLanguages = templateMeta?.supportedLanguages || ["en"];
  const showLanguageSwitcher =
    Array.isArray(supportedLanguages) && supportedLanguages.length > 1;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 rounded-lg shadow p-6 overflow-hidden">
      <div className="h-full flex gap-6">
        <div className="flex flex-col w-96">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {showLanguageSwitcher && (
                <LanguageSwitcher
                  supportedLanguages={supportedLanguages}
                  selectedLang={language}
                  onSelectLang={setLanguage}
                />
              )}
              {hasUnsavedChanges && (
                <span className="text-orange-600 text-sm font-medium">
                  • Unsaved changes
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto pr-2">
            {translations && Object.keys(translations).length === 0 && (
              <div className="text-gray-400 text-center py-8">
                No translations found.
              </div>
            )}
            {renderFlatInputs()}
          </div>
        </div>

        <div className="flex-1 h-full overflow-auto">
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

export default TranslationEditor;
