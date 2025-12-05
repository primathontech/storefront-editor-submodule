/**
 * Section Translation Utilities
 *
 * Utilities for handling translation keys when adding sections from library.
 * Ensures each section instance gets unique translation keys to avoid overwrites.
 */

import { translationUtils } from "../stores/dualTranslationStore";
// Import all theme translations statically (same as src/i18n.ts)
// Note: getMessages() from next-intl/server is server-side only and can't be used in client components
import WellversedCommonEn from "@/themes/wellversed/locales/common/en.json";
import WellversedHomeEn from "@/themes/wellversed/locales/pages/home/en.json";

// Merge all theme translations (same structure as src/i18n.ts)
const allThemeTranslations = Object.assign(
  {},
  WellversedCommonEn,
  WellversedHomeEn
);

/**
 * Extract all translation keys from an object recursively
 */
export function extractTranslationKeys(obj: any): string[] {
  const keys: string[] = [];

  if (typeof obj === "string" && translationUtils.isTranslationKey(obj)) {
    keys.push(obj);
    return keys;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      keys.push(...extractTranslationKeys(item));
    });
  } else if (obj && typeof obj === "object") {
    Object.values(obj).forEach((value) => {
      keys.push(...extractTranslationKeys(value));
    });
  }

  return keys;
}

/**
 * Get value at path in nested object
 */
export function getValueByPath(obj: any, path: string[]): any {
  let current = obj;
  for (const key of path) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * Set value at path in nested object (immutable)
 */
function setValueByPath(obj: any, path: string[], value: any): any {
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
 * Remap translation keys in an object recursively
 */
export function remapTranslationKeys(
  obj: any,
  oldSectionPattern: string,
  newSectionKey: string,
  templateId: string
): any {
  if (typeof obj === "string") {
    if (translationUtils.isTranslationKey(obj)) {
      const path = translationUtils.getTranslationPath(obj);

      // Keep common keys unchanged
      if (path[0] === "common") {
        return obj;
      }

      // Remap section keys: anyNamespace.sections.oldPattern.* -> templateId.sections.newKey.*
      if (
        path.length >= 3 &&
        path[1] === "sections" &&
        path[2] === oldSectionPattern
      ) {
        const newPath = [
          templateId,
          "sections",
          newSectionKey,
          ...path.slice(3),
        ];
        return translationUtils.createTranslationKey(newPath);
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      remapTranslationKeys(item, oldSectionPattern, newSectionKey, templateId)
    );
  }

  if (obj && typeof obj === "object") {
    const result: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = remapTranslationKeys(
        value,
        oldSectionPattern,
        newSectionKey,
        templateId
      );
    });
    return result;
  }

  return obj;
}

/**
 * Create section translations from static theme translations
 * Uses same source as src/i18n.ts (static imports)
 */
export function createSectionTranslations(
  translationKeys: string[],
  templateId: string,
  oldSectionPattern: string,
  newSectionKey: string
): Record<string, any> {
  const newTranslations: Record<string, any> = {};

  translationKeys.forEach((keyStr) => {
    if (!translationUtils.isTranslationKey(keyStr)) return;

    const path = translationUtils.getTranslationPath(keyStr);

    // Skip common keys
    if (path[0] === "common") return;

    // Process any section key matching the old pattern (regardless of original namespace)
    if (
      path.length >= 3 &&
      path[1] === "sections" &&
      path[2] === oldSectionPattern
    ) {
      // Get source value from all theme translations (static imports, same as src/i18n.ts)
      const sourceValue = getValueByPath(allThemeTranslations, path);

      // Create new path: templateId.sections.newSectionKey.{rest}
      const restPath = path.slice(3);
      const newPath = [templateId, "sections", newSectionKey, ...restPath];

      // Build nested structure
      if (!newTranslations[templateId]) {
        newTranslations[templateId] = {};
      }
      if (!newTranslations[templateId].sections) {
        newTranslations[templateId].sections = {};
      }

      // Set value at new path within sections
      newTranslations[templateId].sections = setValueByPath(
        newTranslations[templateId].sections,
        [newSectionKey, ...restPath],
        sourceValue ?? ""
      );
    }
  });

  return newTranslations;
}
