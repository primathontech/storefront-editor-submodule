import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { nanoid } from "nanoid";
import { sectionRegistry } from "@/cms/schemas/section-registry";
import { widgetRegistry } from "@/cms/schemas/widget-registry";

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
  if (!requiredType || !pageConfig.dataSources) return null;

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
  pageData: any | null;
  themeId: string; // Add themeId to state
  routeContext: any; // Add routeContext to state

  // UI State
  selectedSectionId: string | null;
  selectedWidgetId: string | null;
  expandedSections: Set<string>;
  showSettingsDrawer: boolean;
  mode: "edit" | "preview";
  device: "desktop" | "mobile" | "fullscreen";

  // Actions
  setPageConfig: (config: any) => void;
  updatePageConfig: (updater: (prev: any) => any) => void;
  setThemeId: (themeId: string) => void; // Add setThemeId action
  setRouteContext: (context: any) => void; // Add setRouteContext action
  updateRouteHandle: (handle: string) => void; // Add updateRouteHandle action

  setPageData: (data: any) => void;
  setExpandedSections: (expandedSections: Set<string>) => void;

  // Selection Actions
  setSelectedSection: (id: string | null) => void;
  setSelectedWidget: (id: string | null) => void;
  toggleSectionExpansion: (sectionId: string) => void;
  setShowSettingsDrawer: (show: boolean) => void;
  setMode: (mode: "edit" | "preview") => void;
  setDevice: (device: "desktop" | "mobile" | "fullscreen") => void;

  // Section Actions
  addSection: (sectionKey: string, insertIndex?: number) => void;
  updateSection: (sectionId: string, updates: any) => void;
  updateSectionSettings: (sectionId: string, key: string, value: any) => void;
  // Widget Actions
  addWidget: (sectionId: string, widgetKey: string) => void;
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
      pageData: null,
      themeId: null, // Default theme
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

      setExpandedSections: (expandedSections: Set<string>) => {
        set({ expandedSections });
      },

      updatePageConfig: (updater) => {
        set((state) => ({ pageConfig: updater(state.pageConfig) }));
      },

      setPageData: (data) => {
        set({ pageData: data });
      },

      setThemeId: (themeId) => {
        set({ themeId });
      },

      setRouteContext: (context) => {
        set({ routeContext: context });
      },

      updateRouteHandle: (handle) => {
        const currentContext = get().routeContext;
        if (!currentContext) return;

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
      addSection: (sectionKey, insertIndex) => {
        console.log("Adding section:", sectionKey, "at index:", insertIndex);
        const sectionSchema = sectionRegistry[sectionKey];
        if (!sectionSchema) {
          console.error("Section schema not found for:", sectionKey);
          console.log("Available sections:", Object.keys(sectionRegistry));
          return;
        }

        const newSection = {
          id: nanoid(),
          type: sectionKey,
          settings: Object.fromEntries(
            Object.entries(sectionSchema.settingsSchema).map(([k, v]) => [
              k,
              v.default,
            ])
          ),
          widgets: [],
        };

        set((state) => {
          console.log(
            "Current sections before adding:",
            state.pageConfig?.sections.length
          );
          const sections = [...(state.pageConfig?.sections || [])];
          const newIndex =
            insertIndex !== undefined ? insertIndex : sections.length;

          if (insertIndex !== undefined) {
            sections.splice(insertIndex, 0, newSection);
          } else {
            sections.push(newSection);
          }

          // Update expanded sections to include the new section
          const newExpandedSections = new Set(state.expandedSections);
          newExpandedSections.add(newSection.id);

          return {
            pageConfig: { ...state.pageConfig, sections },
            selectedSectionId: newSection.id,
            selectedWidgetId: null,
            expandedSections: newExpandedSections,
            showSettingsDrawer: true,
          };
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
          sections[sectionIndex] = { ...sections[sectionIndex], ...updates };
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
          const sections = [...(state.pageConfig?.sections || [])];
          const sectionIndex = sections.findIndex((s) => s.id === sectionId);
          if (sectionIndex === -1) {
            console.error("Section not found with ID:", sectionId);
            return {};
          }
          sections.splice(sectionIndex, 1);
          return {
            pageConfig: { ...state.pageConfig, sections },
            selectedSectionId: null,
            selectedWidgetId: null,
            showSettingsDrawer: false,
          };
        });
      },

      // Widget Actions
      addWidget: (sectionId, widgetKey) => {
        console.log("Adding widget:", widgetKey, "to section:", sectionId);
        const widgetSchema = widgetRegistry[widgetKey];
        if (!widgetSchema) {
          console.error("Widget schema not found for:", widgetKey);
          return;
        }

        set((state) => {
          // Determine data source for this widget
          let dataSourceKey: string | null = null;
          let updatedDataSources = { ...(state.pageConfig?.dataSources || {}) };

          // First, try to find existing compatible data source
          const existingDataSource = findCompatibleDataSource(
            state.pageConfig || {},
            widgetKey
          );
          if (existingDataSource) {
            dataSourceKey = existingDataSource;
            console.log("Reusing existing data source:", existingDataSource);
          } else {
            // Create new data source
            const requiredType = WIDGET_DATA_SOURCE_MAP[widgetKey];
            if (requiredType) {
              dataSourceKey = generateDataSourceKey(widgetKey);
              updatedDataSources[dataSourceKey] = {
                type: requiredType,
                params: {},
                required: false,
              };
              console.log(
                "Created new data source:",
                dataSourceKey,
                "of type:",
                requiredType
              );
            }
          }

          const newWidget = {
            id: nanoid(),
            type: widgetKey,
            name: widgetSchema.name || widgetKey,
            dataSourceKey,
            settings: Object.fromEntries(
              Object.entries(widgetSchema.settingsSchema).map(([k, v]) => [
                k,
                v.default,
              ])
            ),
          };

          console.log("New widget with data source:", newWidget);

          const sections = [...(state.pageConfig?.sections || [])];
          const sectionIndex = sections.findIndex((s) => s.id === sectionId);
          if (sectionIndex === -1) {
            console.error("Section not found with ID:", sectionId);
            return {};
          }
          const section = { ...sections[sectionIndex] };
          section.widgets = [...section.widgets, newWidget];
          sections[sectionIndex] = section;

          return {
            pageConfig: {
              ...state.pageConfig,
              sections,
              dataSources: updatedDataSources,
            },
            selectedWidgetId: newWidget.id,
            showSettingsDrawer: true,
          };
        });
      },

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
        set((state) => ({
          pageConfig: {
            ...state.pageConfig,
            dataSources: {
              ...state.pageConfig?.dataSources,
              [key]: {
                ...state.pageConfig?.dataSources[key],
                ...updates,
              },
            },
          },
        }));
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
        if (!ctx) return null;
        if (ctx.type === "product") return "productHandle";
        if (ctx.type === "collection") return "collectionHandle";
        if (typeof ctx === "object") {
          if ("productHandle" in ctx) return "productHandle";
          if ("collectionHandle" in ctx) return "collectionHandle";
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
export const RESPONSIVE_FRAME_STYLE = {
  mobile: {
    width: 375,
    height: 667,
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
