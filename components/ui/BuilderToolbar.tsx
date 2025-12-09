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
import { sectionRegistry } from "@/cms/schemas/section-registry";
import { widgetRegistry } from "@/cms/schemas/widget-registry";
import { TranslationService } from "@/lib/i18n/translation-service";
import { DATA_SOURCE_TYPES } from "@/lib/page-builder/models/page-config-types";
import Dialog from "./Dialog";
import { availableSectionsRegistry } from "@/registries/available-sections-registry";
import { useDataSourceOptions } from "../../hooks/useDataSourceOptions";

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
    selectedSectionId !== null && pageConfig?.sections
      ? pageConfig.sections.find((s: any) => s.id === selectedSectionId)
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

  // Fetch options for data source dropdown
  const { options: dataSourceOptions, loading: dataSourceOptionsLoading } =
    useDataSourceOptions(selectedDataSource?.type || null);

  // Defensive check for pageConfig (after all hooks)
  if (!pageConfig || !Array.isArray(pageConfig.sections)) {
    return <div className="text-gray-500 p-4">No template loaded.</div>;
  }

  // Helper function to create options from available sections registry
  const getAvailableSectionOptions = () => {
    const entries = availableSectionsRegistry.availableSections || {};
    return Object.entries(entries).map(([key, section]: [string, any]) => ({
      value: key,
      label: section.name,
    }));
  };

  const handleCloseAddSectionModal = () => {
    setIsAddSectionModalOpen(false);
    setInsertAfterIndex(null);
  };

  const handleAddSectionFromLibrary = (libraryKey: string) => {
    addSectionFromLibrary(libraryKey, insertAfterIndex);
    handleCloseAddSectionModal();
  };

  const handleSectionSettingChange = (key: string, value: any) => {
    if (selectedSectionId === null) return;
    const section = pageConfig.sections.find(
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
    if (selectedSectionId === null || selectedWidgetId === null) return;
    const section = pageConfig.sections.find(
      (s: any) => s.id === selectedSectionId
    );
    if (!section) return;
    const widget = section.widgets.find((w: any) => w.id === selectedWidgetId);
    if (!widget) return;

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

  const renderDataSourceEditor = () => {
    if (!selectedWidget || !selectedDataSource) return null;

    const type = selectedDataSource.type;
    const params = selectedDataSource.params || {};
    const dataSourceKey = selectedWidget.dataSourceKey;
    if (!dataSourceKey) return null;

    const handleSelect = (handle: string) => {
      updateDataSource(dataSourceKey, {
        params: { ...params, handle },
      });
    };

    const handleProductSelect = (handle: string) => {
      updateDataSource(dataSourceKey, {
        params: { ...params, productHandle: handle },
      });
    };

    if (type === DATA_SOURCE_TYPES.COLLECTION_BY_HANDLES) {
      const currentValue = params.handle ?? "";
      return (
        <div className="mb-6 border-t pt-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Data source
          </h4>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Collection
          </label>
          {dataSourceOptionsLoading ? (
            <div className="text-xs text-gray-500 py-2">Loading...</div>
          ) : (
            <SimpleSelect
              options={dataSourceOptions}
              value={currentValue}
              onSelect={handleSelect}
              placeholder="Select collection"
              size="sm"
            />
          )}
        </div>
      );
    }

    if (type === DATA_SOURCE_TYPES.PRODUCT) {
      const currentValue = params.handle ?? "";
      return (
        <div className="mb-6 border-t pt-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Data source
          </h4>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Product
          </label>
          {dataSourceOptionsLoading ? (
            <div className="text-xs text-gray-500 py-2">Loading...</div>
          ) : (
            <SimpleSelect
              options={dataSourceOptions}
              value={currentValue}
              onSelect={handleSelect}
              placeholder="Select product"
              size="sm"
            />
          )}
        </div>
      );
    }

    if (type === DATA_SOURCE_TYPES.PRODUCTS_BY_HANDLES) {
      const currentHandles = Array.isArray(params.handles)
        ? params.handles
        : [];
      const handleAddProduct = (handle: string) => {
        if (!currentHandles.includes(handle)) {
          updateDataSource(dataSourceKey, {
            params: { ...params, handles: [...currentHandles, handle] },
          });
        }
      };
      const handleRemoveProduct = (handle: string) => {
        updateDataSource(dataSourceKey, {
          params: {
            ...params,
            handles: currentHandles.filter((h: string) => h !== handle),
          },
        });
      };
      return (
        <div className="mb-6 border-t pt-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Data source
          </h4>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Products
          </label>
          {dataSourceOptionsLoading ? (
            <div className="text-xs text-gray-500 py-2">Loading...</div>
          ) : (
            <>
              <SimpleSelect
                options={dataSourceOptions.filter(
                  (opt) => !currentHandles.includes(opt.value)
                )}
                value=""
                onSelect={handleAddProduct}
                placeholder="Add product"
                size="sm"
                className="mb-2"
              />
              {currentHandles.length > 0 && (
                <div className="space-y-1 mt-2">
                  {currentHandles.map((handle: string) => {
                    const option = dataSourceOptions.find(
                      (opt) => opt.value === handle
                    );
                    return (
                      <div
                        key={handle}
                        className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded"
                      >
                        <span>{option?.label || handle}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(handle)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    if (type === DATA_SOURCE_TYPES.PRODUCT_RECOMMENDATIONS) {
      const currentValue = params.productHandle ?? "";
      return (
        <div className="mb-6 border-t pt-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Data source
          </h4>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Base product
          </label>
          {dataSourceOptionsLoading ? (
            <div className="text-xs text-gray-500 py-2">Loading...</div>
          ) : (
            <SimpleSelect
              options={dataSourceOptions}
              value={currentValue}
              onSelect={handleProductSelect}
              placeholder="Select product"
              size="sm"
            />
          )}
        </div>
      );
    }

    return null;
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
                                <SidebarMenuItem
                                  selected={isSelected}
                                  // onClick={() => handleSectionSelect(section.id)}
                                  className="group hover:!bg-transparent cursor-default"
                                >
                                  {/* <SidebarMenuButton> */}
                                  <div className="flex-1 text-left min-w-0">
                                    <span className="text-sm font-medium truncate">
                                      {sectionSchema?.name || section.type}
                                    </span>
                                    {section.widgets.length > 0 && (
                                      <span className="text-xs text-gray-500 ml-2">
                                        ({section.widgets.length})
                                      </span>
                                    )}
                                  </div>
                                  {/* Remove Section Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSection(section.id);
                                    }}
                                    className="ml-2 text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-100"
                                    title="Remove section"
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
                                  {/* </SidebarMenuButton> */}
                                </SidebarMenuItem>

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
              {selectedSection && selectedSectionSchema && !selectedWidget && (
                <DynamicForm
                  schema={convertSchemaToFormSchema(
                    selectedSectionSchema.settingsSchema
                  )}
                  values={selectedSection.settings}
                  onUpdate={handleSectionSettingChange}
                  translationService={translationService}
                />
              )}

              {renderDataSourceEditor()}

              {/* Widget Settings */}
              {selectedWidget && selectedWidgetSchema && (
                <DynamicForm
                  schema={convertSchemaToFormSchema(
                    selectedWidgetSchema.settingsSchema
                  )}
                  values={selectedWidget.settings}
                  onUpdate={handleWidgetSettingChange}
                  translationService={translationService}
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
      <Dialog
        open={isAddSectionModalOpen}
        onClose={handleCloseAddSectionModal}
        title="Add section"
        footer={
          <>
            <button
              type="button"
              onClick={handleCloseAddSectionModal}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCloseAddSectionModal}
              className="px-4 py-2 rounded text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              Done
            </button>
          </>
        }
      >
        <p className="mb-3 text-xs text-gray-500">
          Choose a section to add to your page. This is a visual preview only;
          selection logic will be wired separately.
        </p>
        <div className="space-y-1">
          {getAvailableSectionOptions().map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleAddSectionFromLibrary(option.value)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <span className="truncate">{option.label}</span>
              <span className="text-[11px] text-gray-400 uppercase tracking-wide">
                Section
              </span>
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
