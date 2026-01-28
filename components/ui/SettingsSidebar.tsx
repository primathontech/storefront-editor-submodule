"use client";

import React, { useMemo, useCallback } from "react";
import { DynamicForm } from "./DynamicForm";
import { convertSchemaToFormSchema } from "../../utils/schema-converter";
import { TranslationService } from "@/lib/i18n/translation-service";
import { Sidebar, SidebarHeader, SidebarContent } from "./Sidebar";
import { useRightSidebarWidth } from "../../context/RightSidebarWidthContext";
import { useEditorState } from "../../stores/useEditorState";
import { sectionRegistry } from "@/app/editor/schemas/section-registry";
import { widgetRegistry } from "@/cms/schemas/widget-registry";

interface SettingsSidebarProps {
  translationService: TranslationService | null;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  translationService,
}) => {
  const { width } = useRightSidebarWidth();
  const {
    selectedSectionId,
    selectedWidgetId,
    pageConfig,
    pendingPageConfig,
    updateSection,
    updateWidget,
    setShowSettingsDrawer,
    setSelectedSection,
    setSelectedWidget,
  } = useEditorState();

  // Get current page config (pending or committed) for reading latest data
  const currentPageConfig = pendingPageConfig || pageConfig;

  // Derive selected section and widget data
  const selectedSection = useMemo(() => {
    if (!selectedSectionId || !currentPageConfig?.sections) {
      return null;
    }
    return (
      currentPageConfig.sections.find((s: any) => s.id === selectedSectionId) ||
      null
    );
  }, [selectedSectionId, currentPageConfig]);

  const selectedSectionSchema = useMemo(() => {
    return selectedSection
      ? sectionRegistry[selectedSection.type] || null
      : null;
  }, [selectedSection]);

  const selectedWidget = useMemo(() => {
    if (!selectedSection || !selectedWidgetId) {
      return null;
    }
    return (
      selectedSection.widgets?.find((w: any) => w.id === selectedWidgetId) ||
      null
    );
  }, [selectedSection, selectedWidgetId]);

  const selectedWidgetSchema = useMemo(() => {
    return selectedWidget ? widgetRegistry[selectedWidget.type] || null : null;
  }, [selectedWidget]);

  // Handlers for settings changes
  const handleSectionSettingChange = useCallback(
    (key: string, value: any) => {
      if (!selectedSectionId) return;
      const section = currentPageConfig?.sections?.find(
        (s: any) => s.id === selectedSectionId
      );
      if (!section) return;

      updateSection(selectedSectionId, {
        settings: {
          ...section.settings,
          [key]: value,
        },
      });
    },
    [selectedSectionId, currentPageConfig, updateSection]
  );

  const handleWidgetSettingChange = useCallback(
    (key: string, value: any) => {
      if (!selectedSectionId || !selectedWidgetId) return;
      const section = currentPageConfig?.sections?.find(
        (s: any) => s.id === selectedSectionId
      );
      if (!section) return;
      const widget = section.widgets?.find(
        (w: any) => w.id === selectedWidgetId
      );
      if (!widget) return;

      updateWidget(selectedSectionId, selectedWidgetId, {
        settings: {
          ...widget.settings,
          [key]: value,
        },
      });
    },
    [selectedSectionId, selectedWidgetId, currentPageConfig, updateWidget]
  );

  const handleClose = useCallback(() => {
    setShowSettingsDrawer(false);
    setSelectedSection(null);
    setSelectedWidget(null);
  }, [setShowSettingsDrawer, setSelectedSection, setSelectedWidget]);

  const getTitle = () => {
    if (selectedWidget) {
      return `${selectedWidget.name || selectedWidgetSchema?.name} Settings`;
    }
    if (selectedSection) {
      return `${selectedSectionSchema?.name} Settings`;
    }
    return "Settings";
  };

  return (
    <Sidebar width={width} borderSide="left" className="flex-shrink-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{getTitle()}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            title="Close settings"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-6">
        {/* Section Settings */}
        {selectedSection && selectedSectionSchema && (
          <>
            <DynamicForm
              schema={convertSchemaToFormSchema(
                selectedSectionSchema.settingsSchema
              )}
              values={selectedSection.settings}
              onUpdate={handleSectionSettingChange}
              translationService={translationService}
              sectionId={selectedSectionId || undefined}
            />
            <br />
          </>
        )}

        {/* Widget Settings */}
        {selectedWidget && selectedWidgetSchema && (
          <>
            <DynamicForm
              schema={convertSchemaToFormSchema(
                selectedWidgetSchema.settingsSchema
              )}
              values={selectedWidget.settings}
              onUpdate={handleWidgetSettingChange}
              translationService={translationService}
              sectionId={selectedSectionId || undefined}
            />

            {/*
              Legacy DataSourceEditor usage (kept as a reference for future reintroduction).
              Original location: BuilderToolbar, before settings were moved to the right sidebar.

              Example wiring (to adapt when we bring DataSourceEditor back here):

              {selectedWidget &&
                selectedDataSource &&
                selectedWidget.dataSourceKey && (
                  <DataSourceEditor
                    dataSource={selectedDataSource}
                    onUpdateParams={(updates) =>
                      updateDataSource(selectedWidget.dataSourceKey, {
                        params: {
                          ...(selectedDataSource.params || {}),
                          ...updates,
                        },
                      })
                    }
                  />
                )}

              <br />
            */}
          </>
        )}

        {/* No Selection State */}
        {!selectedSection && !selectedWidget && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-3xl mb-3 opacity-50">⚙️</div>
            <p className="text-sm font-medium mb-1">No item selected</p>
            <p className="text-xs text-gray-400">
              Select a section or widget to edit settings
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
