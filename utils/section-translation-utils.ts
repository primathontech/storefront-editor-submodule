/**
 * Section Translation Utilities
 *
 * Simplified utilities for handling translation keys when adding sections from library.
 * Uses self-contained default translations from section library instead of searching existing files.
 */

import { translationUtils } from "../stores/dualTranslationStore";

/**
 * Set value at path in nested object (immutable)
 */
export function setValueByPath(obj: any, path: string[], value: any): any {
  if (path.length === 1) {
    return { ...obj, [path[0]]: value };
  }
  const [head, ...rest] = path;
  return {
    ...obj,
    [head]: setValueByPath(obj[head] || {}, rest, value),
  };
}

/**
 * Process section widgets: remap translation keys and collect keys for translation creation
 * Returns: { remappedWidgets, translationKeys, oldSectionPattern }
 */
export function processSectionWidgets(
  widgets: any[],
  newSectionKey: string,
  templateId: string | null,
  isCommon: boolean
): {
  remappedWidgets: any[];
  translationKeys: string[];
  oldSectionPattern: string | null;
} {
  const translationKeys: string[] = [];
  let oldSectionPattern: string | null = null;

  const remappedWidgets = widgets.map((widget) => {
    if (!widget.settings) return widget;

    // Remap and collect keys in one pass
    const remappedSettings = remapAndCollectKeys(
      widget.settings,
      newSectionKey,
      templateId,
      isCommon,
      translationKeys,
      (pattern) => {
        if (!oldSectionPattern) oldSectionPattern = pattern;
      }
    );

    return { ...widget, settings: remappedSettings };
  });

  return { remappedWidgets, translationKeys, oldSectionPattern };
}

/**
 * Remap translation keys and collect them in one pass
 */
function remapAndCollectKeys(
  obj: any,
  newSectionKey: string,
  templateId: string | null,
  isCommon: boolean,
  translationKeys: string[],
  onPatternFound: (pattern: string) => void
): any {
  if (typeof obj === "string") {
    if (translationUtils.isTranslationKey(obj)) {
      const path = translationUtils.getTranslationPath(obj);
      translationKeys.push(obj);

      // Keep common keys unchanged (they're shared)
      if (path[0] === "common") {
        return obj;
      }

      // For common sections, keep keys as-is
      if (isCommon) {
        return obj;
      }

      // For template-specific sections: remap to unique key
      // Pattern: sections.{pattern}.* → sections.{uniqueKey}.*
      if (path.length >= 2 && path[0] === "sections" && templateId) {
        const pattern = path[1];
        onPatternFound(pattern);
        const newPath = ["sections", newSectionKey, ...path.slice(2)];
        return translationUtils.createTranslationKey(newPath);
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      remapAndCollectKeys(
        item,
        newSectionKey,
        templateId,
        isCommon,
        translationKeys,
        onPatternFound
      )
    );
  }

  if (obj && typeof obj === "object") {
    const result: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = remapAndCollectKeys(
        value,
        newSectionKey,
        templateId,
        isCommon,
        translationKeys,
        onPatternFound
      );
    });
    return result;
  }

  return obj;
}

/**
 * Create section translations from section library defaults
 * Simplified: uses self-contained defaults, only processes template-specific sections
 */
export function createSectionTranslations(
  translationKeys: string[],
  defaultTranslations: Record<string, Record<string, any>>,
  language: string,
  templateId: string,
  oldSectionPattern: string,
  newSectionKey: string
): Record<string, any> {
  const newTranslations: Record<string, any> = {};
  const defaults =
    defaultTranslations[language] || defaultTranslations["en"] || {};

  for (const keyStr of translationKeys) {
    if (!translationUtils.isTranslationKey(keyStr)) continue;

    const path = translationUtils.getTranslationPath(keyStr);
    // Skip common keys and non-section keys
    // Pattern: sections.{oldSectionPattern}.*
    if (
      path[0] === "common" ||
      path[0] !== "sections" ||
      path.length < 2 ||
      path[1] !== oldSectionPattern
    ) {
      continue;
    }

    // Get default value from section library
    const defaultKey = path.join(".");
    const sourceValue = defaults[defaultKey] ?? "";

    // Store at top level: sections.{uniqueKey}.{rest}
    newTranslations.sections = setValueByPath(
      newTranslations.sections || {},
      [newSectionKey, ...path.slice(2)],
      sourceValue
    );
  }

  return newTranslations;
}
