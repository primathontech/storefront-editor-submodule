import { create } from "zustand";
import { api } from "../services/api";
import { createSectionTranslations } from "../utils/section-translation-utils";

interface DualTranslationState {
  // Public interface (same as original store)
  translations: Record<string, any>; // Merged translations
  language: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  // Internal dual file state
  commonTranslations: Record<string, any>;
  templateTranslations: Record<string, any>;
  translationSourceMap: Map<string, "common" | "template">;

  // Actions (same interface as original)
  setLanguage: (language: string) => void;
  setTranslations: (translations: Record<string, any>) => void;
  updateTranslation: (path: string[], value: any) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  clearError: () => void;

  // API Actions (enhanced)
  getTranslations: (
    themeId: string,
    templateId: string,
    language: string
  ) => Promise<void>;
  saveTranslations: (themeId: string, templateId: string) => Promise<void>;

  // Section Translation Actions
  createSectionTranslations: (
    translationKeys: string[],
    defaultTranslations: Record<string, Record<string, any>>,
    language: string,
    templateId: string,
    oldSectionPattern: string,
    uniqueSectionKey: string
  ) => void;
  removeSectionTranslations: (sectionId: string, templateId: string) => void;
}

// Helper function to flatten object and get all paths
function flattenObject(obj: any, path: string[] = []): string[][] {
  const result: string[][] = [];

  Object.entries(obj).forEach(([key, value]) => {
    const currentPath = [...path, key];

    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        result.push(currentPath);
      } else {
        result.push(...flattenObject(value, currentPath));
      }
    } else {
      result.push(currentPath);
    }
  });

  return result;
}

// Helper function for deep merge
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] || {}, value);
    } else {
      result[key] = value;
    }
  });

  return result;
}

// Translation utilities
export const translationUtils = {
  isTranslationKey: (value: any): boolean =>
    typeof value === "string" && value.startsWith("t:"),

  getTranslationKey: (value: string): string => value.substring(2),

  getTranslationPath: (value: string): string[] =>
    value.substring(2).split("."),

  createTranslationKey: (path: string[]): string => `t:${path.join(".")}`,
};

export const useDualTranslationStore = create<DualTranslationState>(
  (set, get) => ({
    // Initial state
    translations: {},
    language: "en",
    isLoading: false,
    isSaving: false,
    error: null,
    hasUnsavedChanges: false,

    // Internal state
    commonTranslations: {},
    templateTranslations: {},
    translationSourceMap: new Map(),

    // State setters
    setLanguage: (language) => set({ language }),
    setTranslations: (translations) => set({ translations }),
    setHasUnsavedChanges: (hasChanges) =>
      set({ hasUnsavedChanges: hasChanges }),
    clearError: () => set({ error: null }),

    // Update translation with source tracking
    updateTranslation: (path: string[], value: any) => {
      const setValueByPath = (obj: any, path: string[], value: any): any => {
        if (path.length === 1) {
          return { ...obj, [path[0]]: value };
        }
        const [head, ...rest] = path;
        return {
          ...obj,
          [head]: setValueByPath(obj[head] || {}, rest, value),
        };
      };

      set((state) => {
        const pathKey = path.join(".");
        const source = state.translationSourceMap.get(pathKey) || "template";

        let newCommonTranslations = state.commonTranslations;
        let newTemplateTranslations = state.templateTranslations;

        if (source === "common") {
          newCommonTranslations = setValueByPath(
            state.commonTranslations,
            path,
            value
          );
        } else {
          newTemplateTranslations = setValueByPath(
            state.templateTranslations,
            path,
            value
          );
        }

        const mergedTranslations = deepMerge(
          newCommonTranslations,
          newTemplateTranslations
        );

        return {
          commonTranslations: newCommonTranslations,
          templateTranslations: newTemplateTranslations,
          translations: mergedTranslations,
          hasUnsavedChanges: true,
        };
      });
    },

    // API Actions
    getTranslations: async (
      themeId: string,
      templateId: string,
      language: string
    ) => {
      set({ isLoading: true, error: null });

      try {
        // Load both common and template-specific translations
        const [commonData, templateData] = await Promise.all([
          api.editor.getTranslation(themeId, "common", language),
          api.editor.getTranslation(themeId, templateId, language),
        ]);

        const commonTranslations = commonData || {};
        const templateTranslations = templateData || {};
        const mergedTranslations = deepMerge(
          commonTranslations,
          templateTranslations
        );

        // Build source tracking map
        const sourceMap = new Map<string, "common" | "template">();

        // Track common translations
        flattenObject(commonTranslations).forEach((path) => {
          sourceMap.set(path.join("."), "common");
        });

        // Track template translations (overrides common)
        flattenObject(templateTranslations).forEach((path) => {
          sourceMap.set(path.join("."), "template");
        });

        set({
          commonTranslations,
          templateTranslations,
          translations: mergedTranslations,
          translationSourceMap: sourceMap,
          language,
          hasUnsavedChanges: false,
        });
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to fetch translation";
        set({ error: errorMsg });
      } finally {
        set({ isLoading: false });
      }
    },

    saveTranslations: async (themeId: string, templateId: string) => {
      const {
        commonTranslations,
        templateTranslations,
        language,
        hasUnsavedChanges,
      } = get();

      if (!hasUnsavedChanges) return;

      set({ isSaving: true, error: null });

      try {
        // Save both files in parallel
        await Promise.all([
          api.editor.saveTranslation(
            themeId,
            "common",
            language,
            commonTranslations
          ),
          api.editor.saveTranslation(
            themeId,
            templateId,
            language,
            templateTranslations
          ),
        ]);

        set({ hasUnsavedChanges: false });
      } catch (err) {
        console.error("Save translations error:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Failed to save translations";
        set({ error: errorMsg });
      } finally {
        set({ isSaving: false });
      }
    },

    // Section Translation Actions
    createSectionTranslations: (
      translationKeys: string[],
      defaultTranslations: Record<string, Record<string, any>>,
      language: string,
      templateId: string,
      oldSectionPattern: string,
      uniqueSectionKey: string
    ) => {
      const state = get();

      // Create new translations from section library defaults
      const newTranslations = createSectionTranslations(
        translationKeys,
        defaultTranslations,
        language,
        templateId,
        oldSectionPattern,
        uniqueSectionKey
      );

      // Merge into templateTranslations
      const updatedTemplateTranslations = deepMerge(
        state.templateTranslations,
        newTranslations
      );

      // Update source map
      const updatedSourceMap = new Map(state.translationSourceMap);
      flattenObject(newTranslations).forEach((path) => {
        updatedSourceMap.set(path.join("."), "template");
      });

      // Merge with common translations
      const mergedTranslations = deepMerge(
        state.commonTranslations,
        updatedTemplateTranslations
      );

      set({
        templateTranslations: updatedTemplateTranslations,
        translations: mergedTranslations,
        translationSourceMap: updatedSourceMap,
        hasUnsavedChanges: true,
      });
    },

    // Remove section translations when section is deleted
    removeSectionTranslations: (sectionId: string, templateId: string) => {
      const state = get();
      const uniqueSectionKey = sectionId.replace(/-/g, "_");
      const sectionPath = `sections.${uniqueSectionKey}`;

      // Early return if no translations exist
      if (!state.templateTranslations.sections?.[uniqueSectionKey]) {
        return;
      }

      // Remove section from templateTranslations.sections
      const { [uniqueSectionKey]: removed, ...remainingSections } =
        state.templateTranslations.sections || {};

      const updatedTemplateTranslations = {
        ...state.templateTranslations,
        sections:
          Object.keys(remainingSections).length > 0
            ? remainingSections
            : undefined,
      };

      if (!updatedTemplateTranslations.sections) {
        delete updatedTemplateTranslations.sections;
      }

      // Remove from source map
      const updatedSourceMap = new Map(state.translationSourceMap);
      Array.from(updatedSourceMap.keys())
        .filter((key) => key.startsWith(sectionPath))
        .forEach((key) => updatedSourceMap.delete(key));

      set({
        templateTranslations: updatedTemplateTranslations,
        translations: deepMerge(
          state.commonTranslations,
          updatedTemplateTranslations
        ),
        translationSourceMap: updatedSourceMap,
        hasUnsavedChanges: true,
      });
    },
  })
);
