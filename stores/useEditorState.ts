import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { nanoid } from "nanoid";
import { sectionRegistry } from "../schemas/section-registry";
import { widgetRegistry } from "@/cms/schemas/widget-registry";
import { availableSectionsRegistry } from "@/registries/available-sections-registry";
import { useDualTranslationStore } from "./dualTranslationStore";
import { processSectionWidgets } from "../utils/section-translation-utils";
import { translationUtils } from "./dualTranslationStore";
import { DEFAULT_BREAKPOINTS } from "@/lib/page-builder/models/responsive-types";

// Widget to Data Source mapping
const WIDGET_DATA_SOURCE_MAP: Record<string, string> = {
  // [WIDGET_TYP.HEADER]: "HEADER",
  // [WIDGET_TYPES.PRODUCT_IMAGE_GALLERY]: "PRODUCT",
  // [WIDGET_TYPES.PRODUCT_INFO]: "PRODUCT",
  // [WIDGET_TYPES.RELATED_PRODUCTS]: "PRODUCTS_BY_HANDLES",
};

// Helper function to generate unique data source key
const generateDataSourceKey = (widgetType: string): string => {
  const baseType = WIDGET_DATA_SOURCE_MAP[widgetType] || "CUSTOM";
  return `${baseType.toLowerCase()}_${Date.now()}`;
};

// Helper function to find existing compatible data source
const findCompatibleDataSource = (
  pageConfig: any,
  widgetType: string
): string | null => {
  const requiredType = WIDGET_DATA_SOURCE_MAP[widgetType];
  if (!requiredType || !pageConfig.dataSources) {
    return null;
  }

  // Look for existing data source of the same type
  for (const [key, source] of Object.entries(pageConfig.dataSources)) {
    if ((source as any).type === requiredType) {
      return key;
    }
  }
  return null;
};

// Types
export interface EditorState {
  // Page Configuration
  pageConfig: any | null;
  pendingPageConfig: any | null;
  pageData: any | null;
  themeId: string; // Add themeId to state
  templateId: string | null; // Template ID for translation namespace
  routeContext: any; // Add routeContext to state
  pageDataStale: boolean;

  // UI State
  selectedSectionId: string | null;
  selectedWidgetId: string | null;
  expandedSections: Set<string>;
  showSettingsDrawer: boolean;
  mode: "edit" | "preview";
  device: "desktop" | "mobile" | "tablet" | "fullscreen";

  // Actions
  setPageConfig: (config: any) => void;
  setPendingPageConfig: (config: any | null) => void;
  updatePageConfig: (updater: (prev: any) => any) => void;
  setThemeId: (themeId: string) => void; // Add setThemeId action
  setTemplateId: (templateId: string | null) => void; // Add setTemplateId action
  setRouteContext: (context: any) => void; // Add setRouteContext action
  updateRouteHandle: (handle: string) => void; // Add updateRouteHandle action

  setPageData: (data: any) => void;
  setPageDataStale: (stale: boolean) => void;
  setExpandedSections: (expandedSections: Set<string>) => void;

  // Selection Actions
  setSelectedSection: (id: string | null) => void;
  setSelectedWidget: (id: string | null) => void;
  toggleSectionExpansion: (sectionId: string) => void;
  setShowSettingsDrawer: (show: boolean) => void;
  setMode: (mode: "edit" | "preview") => void;
  setDevice: (device: "desktop" | "mobile" | "tablet" | "fullscreen") => void;

  // Section Actions
  addSection: (
    section: any,
    insertIndex?: number,
    extraDataSources?: Record<string, any>
  ) => void;
  addSectionFromLibrary: (
    libraryKey: string,
    insertAfterIndex?: number | null
  ) => void;
  updateSection: (sectionId: string, updates: any) => void;
  updateSectionSettings: (sectionId: string, key: string, value: any) => void;
  // Widget Actions
  updateWidget: (sectionId: string, widgetId: string, updates: any) => void;
  updateWidgetSettings: (
    sectionId: string,
    widgetId: string,
    key: string,
    value: any
  ) => void;
  // Remove actions
  removeSection: (sectionId: string) => void;
  removeWidget: (sectionId: string, widgetId: string) => void;
  moveSection: (fromId: string, toId: string) => void;

  // Data Source Actions
  addDataSource: (key: string, type: string, params?: any) => void;
  updateDataSource: (key: string, updates: any) => void;
  removeDataSource: (key: string) => void;

  // Computed Values
  getSelectedSection: () => any;
  getSelectedWidget: () => any;
  getSelectedSectionSchema: () => any;
  getSelectedWidgetSchema: () => any;
  getWidgetRegistry: () => any; // Add getter for theme-specific widget registry
  getRouteHandleKey: () => "productHandle" | "collectionHandle" | null;
  getRouteHandle: () => string | null;
}

export const useEditorState = create<EditorState>()(
  devtools(
    (set, get) => ({
      // Initial State - No default template
      pageConfig: null,
      pendingPageConfig: null,
      pageData: null,
      pageDataStale: false,
      themeId: null, // Default theme
      templateId: null, // Template ID
      routeContext: null, // Default route context
      selectedSectionId: null,
      selectedWidgetId: null,
      expandedSections: new Set(),
      showSettingsDrawer: false,
      mode: "edit",
      device: "desktop",

      // Page Configuration Actions
      setPageConfig: (config) => {
        set({ pageConfig: config });
      },

      setPendingPageConfig: (config) => {
        set({ pendingPageConfig: config });
      },

      setExpandedSections: (expandedSections: Set<string>) => {
        set({ expandedSections });
      },

      updatePageConfig: (updater) => {
        set((state) => ({ pageConfig: updater(state.pageConfig) }));
      },

      setPageData: (data) => {
        set({ pageData: data, pageDataStale: false });
      },

      setPageDataStale: (stale) => {
        set({ pageDataStale: stale });
      },

      setThemeId: (themeId) => {
        set({ themeId });
      },

      setTemplateId: (templateId) => {
        set({ templateId });
      },

      setRouteContext: (context) => {
        set({ routeContext: context });
      },

      updateRouteHandle: (handle) => {
        const currentContext = get().routeContext;
        if (!currentContext) {
          return;
        }

        const updatedContext = { ...currentContext };
        if (currentContext.type === "product") {
          updatedContext.path = `/products/${handle}`;
          updatedContext.params = { handle };
          updatedContext.productHandle = decodeURIComponent(handle);
        } else if (currentContext.type === "collection") {
          updatedContext.path = `/collections/${handle}`;
          updatedContext.collectionHandle = decodeURIComponent(handle);
        }
        set({ routeContext: updatedContext });
      },

      // Selection Actions
      setSelectedSection: (id) => {
        set({
          selectedSectionId: id,
          selectedWidgetId: null,
          showSettingsDrawer: id !== null,
        });
      },

      setSelectedWidget: (id) => {
        set({
          selectedWidgetId: id,
          showSettingsDrawer: id !== null,
        });
      },

      toggleSectionExpansion: (sectionId) => {
        set((state) => {
          const newExpandedSections = new Set(state.expandedSections);
          if (newExpandedSections.has(sectionId)) {
            newExpandedSections.delete(sectionId);
          } else {
            newExpandedSections.add(sectionId);
          }
          return { expandedSections: newExpandedSections };
        });
      },

      setShowSettingsDrawer: (show) => {
        set({ showSettingsDrawer: show });
      },

      setMode: (mode) => set({ mode }),
      setDevice: (device) => set({ device }),

      // Section Actions
      addSection: (section, insertIndex, extraDataSources) => {
        set((state) => {
          const prevPageConfig = state.pageConfig || {};
          const sections = [...(prevPageConfig.sections || [])];
          const newIndex =
            insertIndex !== undefined ? insertIndex : sections.length;
          sections.splice(newIndex, 0, section);

          const dataSources = {
            ...(prevPageConfig.dataSources || {}),
            ...(extraDataSources || {}),
          };

          const newExpandedSections = new Set(state.expandedSections);
          newExpandedSections.add(section.id);

          return {
            pageConfig: { ...prevPageConfig, sections, dataSources },
            selectedSectionId: section.id,
            selectedWidgetId: section.widgets?.[0]?.id ?? null,
            expandedSections: newExpandedSections,
            showSettingsDrawer: true,
          };
        });
      },

      addSectionFromLibrary: (libraryKey, insertAfterIndex) => {
        const entries = availableSectionsRegistry.availableSections || {};
        const existingBlock = (entries as any)[libraryKey];
        if (!existingBlock) {
          console.error("Available section not found for key:", libraryKey);
          return;
        }

        const uniqueId = nanoid(6);
        const {
          id,
          name,
          type,
          isCommon: isCommonFlag,
          settings,
          widgets: libraryWidgets = [],
        } = existingBlock as any;

        const isCommon = isCommonFlag === true;

        const sectionId = `${id}-${uniqueId}`;
        const widgets = libraryWidgets.map((widget: any) => ({
          ...widget,
          id: `${widget.id}-${uniqueId}`,
        }));

        const extraDataSources: Record<string, any> = {};

        const sectionForPage = {
          id: sectionId,
          name,
          type,
          isCommon,
          settings,
          widgets: widgets.map((widget: any) => {
            if (widget.dataSourceTemplate) {
              const baseKey = widget.id || widget.name || "dataSource";
              const safeBase = String(baseKey)
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "_");
              const dataSourceKey = `${safeBase}_${uniqueId}`;

              extraDataSources[dataSourceKey] = {
                type: widget.dataSourceTemplate.type,
                params: widget.dataSourceTemplate.params || {},
                required:
                  widget.dataSourceTemplate.required === undefined
                    ? false
                    : widget.dataSourceTemplate.required,
              };

              return {
                ...widget,
                dataSourceKey,
              };
            }

            return widget;
          }),
        };

        // Process translations: remap keys and create translations
        const editorState = get();
        const translationStore = useDualTranslationStore.getState();
        const templateId = editorState.templateId;
        const uniqueSectionKey = sectionId.replace(/-/g, "_");

        // Process template-specific sections (common sections use existing common.* keys)
        if (!isCommon && templateId) {
          const { remappedWidgets, translationKeys, oldSectionPattern } =
            processSectionWidgets(
              sectionForPage.widgets,
              uniqueSectionKey,
              templateId,
              isCommon
            );

          sectionForPage.widgets = remappedWidgets;

          // Create translations if section keys found
          if (translationKeys.length > 0 && oldSectionPattern) {
            translationStore.createSectionTranslations(
              translationKeys,
              existingBlock.defaultTranslations || { en: {} },
              translationStore.language || "en",
              templateId,
              oldSectionPattern,
              uniqueSectionKey
            );
          }
        }

        const hasDynamicData = Object.keys(extraDataSources).length > 0;

        // Compute concrete insert index once so both paths share the same logic
        const baseForIndex = editorState.pageConfig || {};
        const sectionsForIndex = [...(baseForIndex.sections || [])];
        const currentLengthForIndex = sectionsForIndex.length;
        const insertIndex =
          insertAfterIndex !== null && insertAfterIndex !== undefined
            ? Math.min(insertAfterIndex + 1, currentLengthForIndex)
            : currentLengthForIndex === 0
              ? 0
              : undefined;

        // For purely static sections (no data sources), commit directly via addSection (no refetch)
        if (!hasDynamicData) {
          editorState.addSection(sectionForPage, insertIndex);
          return;
        }

        // For sections that introduce data sources, stage config and refetch
        const baseConfig =
          editorState.pendingPageConfig || editorState.pageConfig || {};
        const sections = [...(baseConfig.sections || [])];
        const targetIndex =
          insertIndex !== undefined ? insertIndex : sections.length;
        sections.splice(targetIndex, 0, sectionForPage);

        const dataSources = {
          ...(baseConfig.dataSources || {}),
          ...(extraDataSources || {}),
        };

        const nextConfig = { ...baseConfig, sections, dataSources };

        set({
          pendingPageConfig: nextConfig,
          pageDataStale: true,
        });
      },

      updateSection: (sectionId, updates) => {
        set((state) => {
          const sections = [...(state.pageConfig?.sections || [])];
          const sectionIndex = sections.findIndex((s) => s.id === sectionId);
          if (sectionIndex === -1) {
            console.error("Section not found with ID:", sectionId);
            return {};
          }
          sections[sectionIndex] = {
            ...sections[sectionIndex],
            ...updates,
          };
          return { pageConfig: { ...state.pageConfig, sections } };
        });
      },

      updateSectionSettings: (sectionId, key, value) => {
        set((state) => {
          const sections = [...(state.pageConfig?.sections || [])];
          const sectionIndex = sections.findIndex((s) => s.id === sectionId);
          if (sectionIndex === -1) {
            console.error("Section not found with ID:", sectionId);
            return {};
          }
          sections[sectionIndex] = {
            ...sections[sectionIndex],
            settings: {
              ...sections[sectionIndex].settings,
              [key]: value,
            },
          };
          return { pageConfig: { ...state.pageConfig, sections } };
        });
      },

      // Remove Section
      removeSection: (sectionId) => {
        set((state) => {
          const baseConfig = state.pendingPageConfig || state.pageConfig || {};
          const sections = [...(baseConfig.sections || [])];
          const sectionIndex = sections.findIndex((s) => s.id === sectionId);
          if (sectionIndex === -1) {
            console.error("Section not found with ID:", sectionId);
            return {};
          }

          const sectionToRemove = sections[sectionIndex];

          // Remove section translations
          const editorState = get();
          const translationStore = useDualTranslationStore.getState();
          const templateId = editorState.templateId;
          if (templateId) {
            translationStore.removeSectionTranslations(sectionId, templateId);
          }

          // Collect data source keys from this section's widgets
          const dataSourceKeys = (sectionToRemove.widgets || [])
            .filter((widget: any) => widget.dataSourceKey)
            .map((widget: any) => widget.dataSourceKey);

          // Check if other sections use these data sources
          const otherSections = sections.filter((s) => s.id !== sectionId);
          const usedDataSourceKeys = new Set<string>();
          otherSections.forEach((section: any) => {
            (section.widgets || []).forEach((widget: any) => {
              if (widget.dataSourceKey) {
                usedDataSourceKeys.add(widget.dataSourceKey);
              }
            });
          });

          // Remove unused data sources
          const dataSources = { ...(baseConfig.dataSources || {}) };
          let hasRemovedDataSources = false;
          dataSourceKeys.forEach((key: string) => {
            if (!usedDataSourceKeys.has(key)) {
              delete dataSources[key];
              hasRemovedDataSources = true;
            }
          });

          // Remove the section
          sections.splice(sectionIndex, 1);

          const nextConfig = { ...baseConfig, sections, dataSources };

          // If we touched data sources, stage config and refetch; otherwise commit directly
          if (hasRemovedDataSources) {
            return {
              pendingPageConfig: nextConfig,
              selectedSectionId: null,
              selectedWidgetId: null,
              showSettingsDrawer: false,
              pageDataStale: true,
            };
          }

          return {
            pageConfig: nextConfig,
            selectedSectionId: null,
            selectedWidgetId: null,
            showSettingsDrawer: false,
          };
        });
      },

      // Widget Actions
      updateWidget: (sectionId, widgetId, updates) => {
        set((state) => {
          const sections = [...(state.pageConfig?.sections || [])];
          const sectionIndex = sections.findIndex((s) => s.id === sectionId);
          if (sectionIndex === -1) {
            console.error("Section not found with ID:", sectionId);
            return {};
          }
          const section = { ...sections[sectionIndex] };
          const widgets = [...section.widgets];
          const widgetIndex = widgets.findIndex((w) => w.id === widgetId);
          if (widgetIndex === -1) {
            console.error("Widget not found with ID:", widgetId);
            return {};
          }
          widgets[widgetIndex] = { ...widgets[widgetIndex], ...updates };
          section.widgets = widgets;
          sections[sectionIndex] = section;
          return { pageConfig: { ...state.pageConfig, sections } };
        });
      },

      updateWidgetSettings: (sectionId, widgetId, key, value) => {
        set((state) => {
          const sections = [...(state.pageConfig?.sections || [])];
          const sectionIndex = sections.findIndex((s) => s.id === sectionId);
          if (sectionIndex === -1) {
            console.error("Section not found with ID:", sectionId);
            return {};
          }
          const section = { ...sections[sectionIndex] };
          const widgets = [...section.widgets];
          const widgetIndex = widgets.findIndex((w) => w.id === widgetId);
          if (widgetIndex === -1) {
            console.error("Widget not found with ID:", widgetId);
            return {};
          }
          widgets[widgetIndex] = {
            ...widgets[widgetIndex],
            settings: {
              ...widgets[widgetIndex].settings,
              [key]: value,
            },
          };
          section.widgets = widgets;
          sections[sectionIndex] = section;
          return { pageConfig: { ...state.pageConfig, sections } };
        });
      },

      // Remove Widget
      removeWidget: (sectionId, widgetId) => {
        set((state) => {
          const sections = [...(state.pageConfig?.sections || [])];
          const sectionIndex = sections.findIndex((s) => s.id === sectionId);
          if (sectionIndex === -1) {
            console.error("Section not found with ID:", sectionId);
            return {};
          }
          if (sections[sectionIndex]) {
            const widgets = [...sections[sectionIndex].widgets];
            const widgetIndex = widgets.findIndex((w) => w.id === widgetId);
            if (widgetIndex === -1) {
              console.error("Widget not found with ID:", widgetId);
              return {};
            }
            widgets.splice(widgetIndex, 1);
            sections[sectionIndex] = { ...sections[sectionIndex], widgets };
          }
          return {
            pageConfig: { ...state.pageConfig, sections },
            selectedWidgetId: null,
            showSettingsDrawer: false,
          };
        });
      },

      // Move Section (DnD)
      moveSection: (fromId, toId) => {
        set((state) => {
          const sections = [...(state.pageConfig?.sections || [])];
          const fromIndex = sections.findIndex((s) => s.id === fromId);
          const toIndex = sections.findIndex((s) => s.id === toId);

          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= sections.length ||
            toIndex >= sections.length
          ) {
            return {};
          }
          const [moved] = sections.splice(fromIndex, 1);
          sections.splice(toIndex, 0, moved);
          return {
            pageConfig: { ...state.pageConfig, sections },
            selectedSectionId: toId,
          };
        });
      },

      // Data Source Actions
      addDataSource: (key, type, params = {}) => {
        set((state) => ({
          pageConfig: {
            ...state.pageConfig,
            dataSources: {
              ...state.pageConfig?.dataSources,
              [key]: {
                type,
                params,
                required: false,
              },
            },
          },
        }));
      },

      updateDataSource: (key, updates) => {
        set((state) => {
          const baseConfig = state.pendingPageConfig || state.pageConfig || {};
          const currentDataSources = baseConfig.dataSources || {};
          const nextDataSources = {
            ...currentDataSources,
            [key]: {
              ...currentDataSources[key],
              ...updates,
            },
          };

          return {
            pendingPageConfig: {
              ...baseConfig,
              dataSources: nextDataSources,
            },
            pageDataStale: true,
          };
        });
      },

      removeDataSource: (key) => {
        set((state) => {
          const { [key]: removed, ...remainingDataSources } =
            state.pageConfig?.dataSources || {};

          // Also remove dataSourceKey from widgets that use this data source
          const sections = (state.pageConfig?.sections || []).map(
            (section: any) => ({
              ...section,
              widgets: section.widgets.map((widget: any) =>
                widget.dataSourceKey === key
                  ? { ...widget, dataSourceKey: null }
                  : widget
              ),
            })
          );

          return {
            pageConfig: {
              ...state.pageConfig,
              dataSources: remainingDataSources,
              sections,
            },
          };
        });
      },

      // Computed Values
      getSelectedSection: () => {
        const state = get();
        return state.selectedSectionId !== null
          ? state.pageConfig?.sections.find(
              (s: any) => s.id === state.selectedSectionId
            )
          : null;
      },

      getSelectedWidget: () => {
        const state = get();
        const selectedSection = state.getSelectedSection();
        return selectedSection && state.selectedWidgetId !== null
          ? selectedSection.widgets.find(
              (w: any) => w.id === state.selectedWidgetId
            )
          : null;
      },

      getSelectedSectionSchema: () => {
        const state = get();
        const selectedSection = state.getSelectedSection();
        return selectedSection ? sectionRegistry[selectedSection.type] : null;
      },

      getSelectedWidgetSchema: () => {
        const state = get();
        const selectedWidget = state.getSelectedWidget();
        return selectedWidget ? widgetRegistry[selectedWidget.type] : null;
      },

      getWidgetRegistry: () => {
        return widgetRegistry;
      },

      // Route helpers
      getRouteHandleKey: () => {
        const ctx = get().routeContext;
        if (!ctx) {
          return null;
        }
        if (ctx.type === "product") {
          return "productHandle";
        }
        if (ctx.type === "collection") {
          return "collectionHandle";
        }
        if (typeof ctx === "object") {
          if ("productHandle" in ctx) {
            return "productHandle";
          }
          if ("collectionHandle" in ctx) {
            return "collectionHandle";
          }
        }
        return null;
      },

      getRouteHandle: () => {
        const key = (get() as any).getRouteHandleKey();
        const ctx = get().routeContext as any;
        return key && ctx ? (ctx[key] ?? null) : null;
      },
    }),
    {
      name: "editor-store",
    }
  )
);

// Centralized responsive frame styles used by the editor preview iframe
// Frame widths align with DEFAULT_BREAKPOINTS from responsive-types.ts
export const RESPONSIVE_FRAME_STYLE = {
  mobile: {
    // Mobile: max 767px, using common mobile width (375px = iPhone standard)
    width: 375,
    height: 667,
    transition: "width 0.2s, height 0.2s",
    boxShadow: "0 0 24px rgba(0,0,0,0.2)",
    borderRadius: 12,
    background: "white",
    border: "none",
    display: "block",
  },
  tablet: {
    // Tablet: 768-1023px, using tablet min width (768px)
    width: DEFAULT_BREAKPOINTS.tablet.min,
    height: 1024,
    transition: "width 0.2s, height 0.2s",
    boxShadow: "0 0 24px rgba(0,0,0,0.2)",
    borderRadius: 12,
    background: "white",
    border: "none",
    display: "block",
  },
  desktop: {
    width: "100%",
    height: "100%",
    transition: "width 0.2s, height 0.2s",
    background: "white",
    border: "none",
    display: "block",
  },
  fullscreen: {
    width: "100%",
    height: "100%",
    background: "white",
    border: "none",
    display: "block",
  },
} as const;
