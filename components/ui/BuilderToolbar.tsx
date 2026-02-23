// components/BuilderToolbar.js
"use client";

import { useEffect, useState } from "react";
import { Input } from "./Input";
import { SidebarScrollArea } from "./Sidebar";
import { SimpleSelect } from "./SimpleSelect";
// dnd-kit imports
import { availableSectionsRegistry } from "@/registries/available-sections-registry";
import {
  closestCenter,
  DndContext,
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
import { DesignSidebar, DesignSidebarHeader } from "./design-system";
import { SectionLibraryDialog } from "./SectionLibraryDialog";
import { SidebarSectionGroup } from "./SidebarSectionGroup";

interface BuilderToolbarProps {
  pageConfig: any;
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
  supportedLanguages?: string[];
  onRouteHandleChange: (handle: string) => void;
}

export default function BuilderToolbar({
  pageConfig,
  currentLocale,
  onLocaleChange,
  supportedLanguages = ["en"], // Default to English if not provided
  onRouteHandleChange,
}: BuilderToolbarProps) {
  const {
    selectedWidgetId,
    setSelectedSection,
    setSelectedWidget,
    setShowSettingsDrawer,
    addSectionFromLibrary,
    removeSection,
    moveSection,
    setPageConfig,
    setExpandedSections,
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
      if (sectionId === libraryId) {
        return true;
      }
      // Starts with library id + dash (library-added sections with nanoid)
      if (sectionId.startsWith(libraryId + "-")) {
        return true;
      }
      return false;
    });
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
    setShowSettingsDrawer(true);
  };

  const handleWidgetSelect = (widgetId: string, sectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedWidget(widgetId);
    setShowSettingsDrawer(true);
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
  function SortableSection({ section }: { section: any }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: section.id });

    const dragStyle = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: 1,
    };

    return (
      <div ref={setNodeRef}>
        <SidebarSectionGroup
          section={section}
          dragListeners={listeners}
          dragAttributes={attributes}
          dragStyle={dragStyle}
          onTitleClick={(widgetId, sectionId) => {
            if (widgetId === sectionId) {
              handleSectionSelect(sectionId);
            } else {
              handleWidgetSelect(widgetId, sectionId);
            }
          }}
          onWidgetClick={handleWidgetSelect}
          onClose={removeSection}
          onAddSection={(sectionId) => {
            const index = pageConfig.sections.findIndex(
              (s: any) => s.id === sectionId
            );
            setInsertAfterIndex(index);
            setIsAddSectionModalOpen(true);
          }}
          sectionErrors={htmlValidationErrors[section.id] || []}
          isInLibrary={isSectionInLibrary(section.id)}
          selectedWidgetId={selectedWidgetId}
        />
      </div>
    );
  }

  return (
    <>
      <DesignSidebar side="left">
        {/* Route Handle Input */}
        {routeHandleKey && (
          <DesignSidebarHeader>
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
          </DesignSidebarHeader>
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

        <SidebarScrollArea className="p-3 space-y-3">
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pageConfig.sections.map((s: any) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {pageConfig.sections.map((section: any) => (
                  <SortableSection key={section.id} section={section} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </SidebarScrollArea>
      </DesignSidebar>

      <SectionLibraryDialog
        open={isAddSectionModalOpen}
        onConfirm={(selectedKey) => {
          if (!selectedKey) {
            return;
          }
          handleAddSectionFromLibrary(selectedKey);
        }}
        onClose={handleCloseAddSectionModal}
      />
    </>
  );
}
