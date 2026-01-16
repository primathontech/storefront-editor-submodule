// components/BuilderToolbar.js
"use client";

import { useEffect, useState } from "react";
import { DynamicForm } from "./DynamicForm";
import { Input } from "./Input";
import { SimpleSelect } from "./SimpleSelect";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarScrollArea,
} from "./Sidebar";
// dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditorState } from "../../stores/useEditorState";
import { sectionRegistry } from "@/app/editor/schemas/section-registry";
import { widgetRegistry } from "@/cms/schemas/widget-registry";
import { TranslationService } from "@/lib/i18n/translation-service";
import { SectionLibraryDialog } from "./SectionLibraryDialog";
// import { DataSourceEditor } from "./DataSourceEditor";
import { availableSectionsRegistry } from "@/registries/available-sections-registry";

interface BuilderToolbarProps {
  pageConfig: any;
  templateName?: string;
  translationService?: TranslationService | null;
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
  supportedLanguages?: string[];
  routeContext: any;
  onRouteHandleChange: (handle: string) => void;
}

export default function BuilderToolbar({
  pageConfig,
  templateName,
  translationService,
  currentLocale,
  onLocaleChange,
  supportedLanguages = ["en"], // Default to English if not provided
  routeContext,
  onRouteHandleChange,
}: BuilderToolbarProps) {
  const {
    selectedSectionId,
    selectedWidgetId,
    expandedSections,
    showSettingsDrawer,
    setSelectedSection,
    setSelectedWidget,
    setShowSettingsDrawer,
    addSectionFromLibrary,
    updateSection,
    updateWidget,
    removeSection,
    removeWidget,
    moveSection,
    setPageConfig,
    setExpandedSections,
    updateDataSource,
    pendingPageConfig,
    htmlValidationErrors,
  } = useEditorState();

  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | null>(null);

  // Get theme-specific widget registry
  const { getRouteHandleKey, getRouteHandle } = useEditorState.getState();
  const routeHandleKey = getRouteHandleKey();
  const routeHandle = getRouteHandle();

  // Auto-expand all sections when pageConfig changes
  useEffect(() => {
    if (pageConfig) {
      setPageConfig(pageConfig);
      // Auto-expand all sections
      const expandedSections = new Set<string>();
      if (pageConfig.sections) {
        pageConfig.sections.forEach((section: any) => {
          expandedSections.add(section.id);
        });
      }
      setExpandedSections(expandedSections);
    }
  }, [pageConfig, setPageConfig, setExpandedSections]);

  // Get current page config (pending or committed) for reading latest data source values
  const currentPageConfig = pendingPageConfig || pageConfig;

  // Get selected section and widget (before early return)
  const selectedSection =
    selectedSectionId !== null && currentPageConfig?.sections
      ? currentPageConfig.sections.find((s: any) => s.id === selectedSectionId)
      : null;
  const selectedSectionSchema =
    selectedSection && sectionRegistry[selectedSection.type];
  const selectedWidget =
    selectedSection && selectedWidgetId !== null
      ? selectedSection.widgets.find((w: any) => w.id === selectedWidgetId)
      : null;
  const selectedWidgetSchema =
    selectedWidget && widgetRegistry[selectedWidget.type];

  const selectedDataSource =
    selectedWidget?.dataSourceKey && currentPageConfig?.dataSources
      ? currentPageConfig.dataSources[selectedWidget.dataSourceKey]
      : null;

  // Defensive check for pageConfig (after all hooks)
  if (!pageConfig || !Array.isArray(pageConfig.sections)) {
    return <div className="text-gray-500 p-4">No template loaded.</div>;
  }

  const handleCloseAddSectionModal = () => {
    setIsAddSectionModalOpen(false);
    setInsertAfterIndex(null);
  };

  const handleAddSectionFromLibrary = (libraryKey: string) => {
    addSectionFromLibrary(libraryKey, insertAfterIndex);
    handleCloseAddSectionModal();
  };

  // Check if a section exists in the available sections library
  const isSectionInLibrary = (sectionId: string): boolean => {
    const entries = availableSectionsRegistry.availableSections || {};
    // Check if section id exactly matches a library section id (template sections like "header-section")
    // OR if section id starts with a library section id + dash (library-added sections like "header-section-abc123")
    return Object.values(entries).some((section: any) => {
      const libraryId = section.id;
      // Exact match (template sections)
      if (sectionId === libraryId) return true;
      // Starts with library id + dash (library-added sections with nanoid)
      if (sectionId.startsWith(libraryId + "-")) return true;
      return false;
    });
  };

  const handleSectionSettingChange = (key: string, value: any) => {
    if (selectedSectionId === null) return;
    const currentConfig = currentPageConfig || pageConfig;
    const section = currentConfig?.sections?.find(
      (s: any) => s.id === selectedSectionId
    );
    if (!section) return;

    updateSection(selectedSectionId, {
      settings: {
        ...section.settings,
        [key]: value,
      },
    });
  };

  const handleWidgetSettingChange = (key: string, value: any) => {
    if (selectedSectionId === null || selectedWidgetId === null) {
      return;
    }
    const section = pageConfig.sections.find(
      (s: any) => s.id === selectedSectionId
    );
    if (!section) {
      return;
    }
    const widget = section.widgets.find((w: any) => w.id === selectedWidgetId);
    if (!widget) {
      return;
    }

    updateWidget(selectedSectionId, selectedWidgetId, {
      settings: {
        ...widget.settings,
        [key]: value,
      },
    });
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  const handleWidgetSelect = (widgetId: string, sectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedWidget(widgetId);
  };

  // Convert schema to DynamicForm format
  const convertSchemaToFormSchema = (schema: any) => {
    const formSchema: any = {};
    Object.entries(schema).forEach(([key, config]: [string, any]) => {
      formSchema[key] = {
        type: config.type,
        label: config.label,
        options: config.options,
        min: config.min,
        max: config.max,
        step: config.step,
        placeholder: config.placeholder,
        fields: config.fields,
        default: config.default,
      };
    });
    return formSchema;
  };

  // dnd-kit setup
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sensors = useSensors(
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Handler for drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldId = pageConfig.sections.findIndex(
        (s: any) => s.id === active.id
      );
      const newId = pageConfig.sections.findIndex((s: any) => s.id === over.id);
      if (oldId !== -1 && newId !== -1) {
        moveSection(active.id, over.id);
      }
    }
  };

  // Sortable Section wrapper
  function SortableSection({
    section,
    idx,
    children,
  }: {
    section: any;
    idx: number;
    children: React.ReactNode;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: section.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      background: isDragging ? "#f3f4f6" : undefined,
      borderRadius: 6,
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <div className="flex items-center">
          {/* Drag handle */}
          <button
            {...listeners}
            className="cursor-grab p-1 mr-2 text-gray-400 hover:text-gray-600"
            title="Drag to reorder"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="6" cy="6" r="1.5" />
              <circle cx="6" cy="12" r="1.5" />
              <circle cx="6" cy="18" r="1.5" />
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
              <circle cx="18" cy="6" r="1.5" />
              <circle cx="18" cy="12" r="1.5" />
              <circle cx="18" cy="18" r="1.5" />
            </svg>
          </button>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      <Sidebar>
        <SidebarHeader
          title={templateName || "Untitled Page"}
          subtitle={`${pageConfig.sections.length} section${
            pageConfig.sections.length !== 1 ? "s" : ""
          }`}
          className="p-4"
        />

        {/* Route Handle Input */}
        {routeHandleKey && (
          <div className="px-4 pb-2">
            <Input
              label="Route Handle"
              value={routeHandle || ""}
              onChange={(e) => onRouteHandleChange(e.target.value)}
              placeholder="Enter route handle"
              size="sm"
              className="w-full"
            />
          </div>
        )}

        {/* Locale Selector */}
        {supportedLanguages?.length > 1 && (
          <div className="px-4 pb-2">
            <SimpleSelect
              options={supportedLanguages.map((locale) => ({
                value: locale,
                label: locale.toUpperCase(),
              }))}
              value={currentLocale}
              onSelect={(value: string | null) =>
                value && onLocaleChange(value)
              }
              placeholder="Select Language"
              size="sm"
              className="w-full"
            />
          </div>
        )}

        <SidebarContent className="px-3">
          {/* Sections List with DnD */}
          <SidebarScrollArea className="px-1">
            {pageConfig.sections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-3xl mb-3 opacity-50">📄</div>
                <p className="text-sm font-medium mb-1">No sections yet</p>
                <p className="text-xs text-gray-400 mb-4">
                  Add a section to get started
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInsertAfterIndex(null);
                    setIsAddSectionModalOpen(true);
                  }}
                  className="px-4 py-2 rounded text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                >
                  Add section
                </button>
              </div>
            ) : (
              <SidebarGroup>
                <SidebarGroupContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pageConfig.sections.map((s: any) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <SidebarMenu>
                        {pageConfig.sections.map(
                          (section: any, index: number) => {
                            const isExpanded = expandedSections.has(section.id);
                            const isSelected = selectedSectionId === section.id;
                            const sectionSchema = sectionRegistry[section.type];
                            return (
                              <SortableSection
                                key={section.id}
                                section={section}
                                idx={index}
                              >
                                {/* Section Header */}
                                {/* Remove Section Button */}
                                {(() => {
                                  const isInLibrary = isSectionInLibrary(
                                    section.id
                                  );
                                  const sectionErrors =
                                    htmlValidationErrors[section.id] || [];
                                  const hasErrors = sectionErrors.length > 0;
                                  return (
                                    <div className="flex items-center">
                                      {hasErrors && (
                                        <div
                                          className="mr-auto p-1 text-red-500"
                                          title={`${sectionErrors.length} HTML validation error${sectionErrors.length !== 1 ? "s" : ""}`}
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
                                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isInLibrary) {
                                            removeSection(section.id);
                                          }
                                        }}
                                        disabled={!isInLibrary}
                                        className={`ml-auto block p-1 rounded transition-colors ${
                                          isInLibrary
                                            ? "text-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer"
                                            : "text-gray-300 cursor-not-allowed opacity-50"
                                        }`}
                                        title={
                                          isInLibrary
                                            ? "Remove section"
                                            : "This section is not removable"
                                        }
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
                                  );
                                })()}
                                {/* </SidebarMenuButton> */}

                                {/* Widgets List */}
                                {section.widgets.length > 0 && (
                                  <div className="ml-4 space-y-1 border-l border-gray-200 pl-3">
                                    {section.widgets.map((widget: any) => (
                                      <SidebarMenuItem
                                        key={widget.id}
                                        selected={
                                          selectedWidgetId === widget.id
                                        }
                                        onClick={() =>
                                          handleWidgetSelect(
                                            widget.id,
                                            section.id
                                          )
                                        }
                                        className="flex items-center"
                                      >
                                        <SidebarMenuButton>
                                          <span className="text-xs font-medium">
                                            {widget.name || widget.type}
                                          </span>
                                          {/* Remove Widget Button */}
                                          {/* <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeWidget(
                                              section.id,
                                              widget.id
                                            );
                                          }}
                                          className="ml-2 text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-100"
                                          title="Remove widget"
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
                                        </button> */}
                                        </SidebarMenuButton>
                                      </SidebarMenuItem>
                                    ))}
                                  </div>
                                )}

                                {/* Add Section Button */}
                                <div className="flex justify-center px-2 py-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInsertAfterIndex(index);
                                      setIsAddSectionModalOpen(true);
                                    }}
                                    className="w-full justify-center gap-1 text-[11px] font-medium text-gray-600 px-3 py-1.5 rounded border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center"
                                  >
                                    <span className="text-sm leading-none">
                                      ＋
                                    </span>
                                    <span>Add section</span>
                                  </button>
                                </div>
                              </SortableSection>
                            );
                          }
                        )}
                      </SidebarMenu>
                    </SortableContext>
                  </DndContext>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarScrollArea>
        </SidebarContent>
      </Sidebar>

      {/* Overlay Settings Drawer */}
      {showSettingsDrawer && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10">
          <div className="absolute inset-0 bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
            {/* Settings Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedWidget
                    ? `${
                        selectedWidget.name || selectedWidgetSchema?.name
                      } Settings`
                    : selectedSection
                      ? `${selectedSectionSchema?.name} Settings`
                      : "Settings"}
                </h3>
                <button
                  onClick={() => {
                    setShowSettingsDrawer(false);
                    setSelectedSection(null);
                    setSelectedWidget(null);
                  }}
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
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Section Settings */}
              {selectedSection && selectedSectionSchema && (
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

              <br />

              {/* {selectedWidget &&
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

              <br /> */}

              {/* Widget Settings */}
              {selectedWidget && selectedWidgetSchema && (
                <DynamicForm
                  schema={convertSchemaToFormSchema(
                    selectedWidgetSchema.settingsSchema
                  )}
                  values={selectedWidget.settings}
                  onUpdate={handleWidgetSettingChange}
                  translationService={translationService}
                  sectionId={selectedSectionId || undefined}
                />
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
            </div>
          </div>
        </div>
      )}
      {/* Add Section Modal */}
      <SectionLibraryDialog
        open={isAddSectionModalOpen}
        onConfirm={(selectedKey) => {
          if (!selectedKey) return;
          handleAddSectionFromLibrary(selectedKey);
        }}
        onClose={handleCloseAddSectionModal}
      />
    </div>
  );
}
