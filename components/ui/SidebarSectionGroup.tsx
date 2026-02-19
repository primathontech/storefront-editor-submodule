import React from "react";
import styles from "./SidebarSectionGroup.module.css";
import { DragDotsIcon } from "./icons/DragDotsIcon";
import { AddCircleIcon } from "./icons/AddCircleIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { Button } from "./design-system";

interface SidebarSectionGroupProps {
  section: any;
  /** Optional callbacks */
  onTitleClick?: (widgetId: string, sectionId: string) => void;
  onWidgetClick?: (widgetId: string, sectionId: string) => void;
  onClose?: (sectionId: string) => void;
  onAddSection?: (sectionId: string) => void;
  /** Validation errors for the section */
  sectionErrors?: any[];
  /** Whether section is in library (removable) */
  isInLibrary?: boolean;
  /** Selected widget ID for highlighting */
  selectedWidgetId?: string | null;
  /** Drag and drop props from dnd-kit */
  dragListeners?: any;
  dragAttributes?: any;
  dragStyle?: React.CSSProperties;
  className?: string;
}

/**
 * Simple, editor-only sidebar section group.
 * Renders a section with its widgets and actions.
 */
export const SidebarSectionGroup: React.FC<SidebarSectionGroupProps> = ({
  section,
  onTitleClick,
  onWidgetClick,
  onClose,
  onAddSection,
  sectionErrors = [],
  isInLibrary = false,
  selectedWidgetId,
  dragListeners,
  dragAttributes,
  dragStyle,
  className,
}) => {
  const groupClassName = [styles.group, className].filter(Boolean).join(" ");

  const firstWidget = section.widgets?.[0];
  const sectionTitle = firstWidget?.name || firstWidget?.type || section.id;
  const hasErrors = sectionErrors.length > 0;
  const hasMultipleWidgets = section.widgets?.length > 1;
  const isFirstWidgetSelected =
    firstWidget && selectedWidgetId === firstWidget.id;

  const handleTitleClick = () => {
    if (onTitleClick) {
      if (firstWidget) {
        onTitleClick(firstWidget.id, section.id);
      } else {
        onTitleClick(section.id, section.id);
      }
    }
  };

  return (
    <div className={groupClassName} style={dragStyle}>
      <div
        className={styles.dragHandle}
        {...dragListeners}
        {...dragAttributes}
        aria-hidden="true"
      >
        <DragDotsIcon />
      </div>
      <div className={styles.sectionContent}>
        <div className={styles.sectionHeader}>
          <h2
            className={styles.title}
            onClick={handleTitleClick}
            style={{
              ...(onTitleClick ? { cursor: "pointer" } : {}),
              ...(isFirstWidgetSelected
                ? { color: "#1e40af", fontWeight: 600 }
                : {}),
            }}
          >
            {sectionTitle}
          </h2>
          <div className={styles.headerActions}>
            {hasErrors && (
              <div
                className="p-1 text-red-500"
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
            {onClose && isInLibrary && (
              <button
                type="button"
                onClick={() => onClose(section.id)}
                className={styles.closeButton}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
        <div className={styles.content}>
          {hasMultipleWidgets && (
            <div className="ml-4 space-y-1 border-l border-gray-200 pl-3 mt-2">
              {section.widgets.slice(1).map((widget: any) => (
                <button
                  key={widget.id}
                  onClick={() => onWidgetClick?.(widget.id, section.id)}
                  className={`text-left w-full px-2 py-1 text-sm rounded ${
                    selectedWidgetId === widget.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {widget.name || widget.type}
                </button>
              ))}
            </div>
          )}
          {onAddSection && (
            <div className="mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<AddCircleIcon />}
                className={styles.addSectionButton}
                onClick={() => onAddSection(section.id)}
              >
                Add Section
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
