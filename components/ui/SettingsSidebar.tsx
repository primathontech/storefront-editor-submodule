"use client";

import { sectionRegistry } from "@/app/editor/schemas/section-registry";
import { widgetRegistry } from "@/cms/schemas/widget-registry";
import { COMMON_WIDGETS } from "@/constants/theme-constants";
import { TranslationService } from "@/lib/i18n/translation-service";
import React, { useCallback, useMemo } from "react";
import { useRightSidebarWidth } from "../../context/RightSidebarWidthContext";
import { useEditorState } from "../../stores/useEditorState";
import { convertSchemaToFormSchema } from "../../utils/schema-converter";
import {
  DesignSidebar,
  DesignSidebarHeader,
  IconButton,
} from "./design-system";
import { DynamicForm } from "./DynamicForm";
import { CloseIcon } from "./icons/CloseIcon";
import styles from "./SettingsSidebar.module.css";

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

  const isCustomHtmlWidget =
    selectedWidgetSchema?.type === COMMON_WIDGETS.CUSTOM_HTML;

  // Handlers for settings changes
  const handleSectionSettingChange = useCallback(
    (key: string, value: any) => {
      if (!selectedSectionId) {
        return;
      }
      const section = currentPageConfig?.sections?.find(
        (s: any) => s.id === selectedSectionId
      );
      if (!section) {
        return;
      }

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
      if (!selectedSectionId || !selectedWidgetId) {
        return;
      }
      const section = currentPageConfig?.sections?.find(
        (s: any) => s.id === selectedSectionId
      );
      if (!section) {
        return;
      }
      const widget = section.widgets?.find(
        (w: any) => w.id === selectedWidgetId
      );
      if (!widget) {
        return;
      }

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
    <DesignSidebar side="right" width={width}>
      <DesignSidebarHeader>
        <h3 className={styles.title}>{getTitle()}</h3>
        <IconButton
          icon={<CloseIcon />}
          variant="ghost"
          size="sm"
          shape="square"
          onClick={handleClose}
          aria-label="Close settings"
        />
      </DesignSidebarHeader>

      <div className={styles.content}>
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

            {/* Section Settings */}
            {selectedSection &&
              selectedSectionSchema &&
              // For Custom HTML widget, hide section-level settings entirely
              !isCustomHtmlWidget && (
                <DynamicForm
                  schema={convertSchemaToFormSchema(
                    selectedSectionSchema.settingsSchema
                  )}
                  values={selectedSection.settings}
                  onUpdate={handleSectionSettingChange}
                  translationService={translationService}
                  sectionId={selectedSectionId || undefined}
                />
              )}

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
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>⚙️</div>
            <p className={styles.emptyStateTitle}>No item selected</p>
            <p className={styles.emptyStateDescription}>
              Select a section or widget to edit settings
            </p>
          </div>
        )}
      </div>
    </DesignSidebar>
  );
};
