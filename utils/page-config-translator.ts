/**
 * Page Configuration Translator for Editor
 *
 * Utility for translating page configuration objects, specifically widget settings
 * that contain translation keys. This duplicates the logic from PageBuildingEngine
 * to ensure consistent translation behavior in the editor.
 */

import { PageConfig } from "@/lib/page-builder/models/page-config-types";
import { TranslationService } from "@/lib/i18n/translation-service";

/**
 * Translate page configuration
 * Processes all widget settings to translate any translation keys
 *
 * This function duplicates the logic from PageBuildingEngine.translatePageConfig()
 * to ensure the editor has the same translation behavior as production.
 */
export function translatePageConfig(
  pageConfig: PageConfig,
  translationService: TranslationService
): PageConfig {
  return {
    ...pageConfig,
    sections: pageConfig.sections.map((section) => ({
      ...section,
      widgets: section.widgets.map((widget) => ({
        ...widget,
        settings: translationService.translateObject(widget.settings || {}),
      })),
    })),
  };
}
