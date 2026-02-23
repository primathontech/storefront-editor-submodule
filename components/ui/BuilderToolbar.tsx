// components/BuilderToolbar.js
"use client";

import { useEffect, useState } from "react";
import { Button, Dropdown } from "./design-system";
import { SidebarScrollArea } from "./Sidebar";
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
import styles from "./BuilderToolbar.module.css";
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
    return <div className={styles["no-template"]}>No template loaded.</div>;
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
        <DesignSidebarHeader>
          <span className={styles["page-title"]}>Home Page</span>
        </DesignSidebarHeader>

        {/* Route Handle Input */}
        {/* {routeHandleKey && (
          <div className={styles["route-handle-container"]}>
            <Input
              label="Route Handle"
              value={routeHandle || ""}
              onChange={(e) => onRouteHandleChange(e.target.value)}
              placeholder="Enter route handle"
              size="md"
              fullWidth
            />
          </div>
        )} */}

        {/* Locale Selector */}
        {supportedLanguages?.length > 1 && (
          <div className={styles["locale-selector-container"]}>
            <Dropdown
              options={supportedLanguages.map((locale) => ({
                value: locale,
                label: locale.toUpperCase(),
              }))}
              value={currentLocale}
              onChange={(value) => onLocaleChange(value)}
              placeholder="Select Language"
              fullWidth
            />
          </div>
        )}

        <SidebarScrollArea className={styles["sections-scroll"]}>
          {pageConfig.sections.length === 0 ? (
            <div className={styles["empty-state"]}>
              <p className={styles["empty-state-title"]}>No sections yet</p>
              <p className={styles["empty-state-description"]}>
                Add a section to get started
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setInsertAfterIndex(null);
                  setIsAddSectionModalOpen(true);
                }}
                className={styles["empty-state-button"]}
              >
                Add section
              </Button>
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
