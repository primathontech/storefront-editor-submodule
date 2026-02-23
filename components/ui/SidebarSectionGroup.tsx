import React from "react";
import styles from "./SidebarSectionGroup.module.css";
import { Button, IconButton } from "./design-system";
import { AddCircleIcon } from "./icons/AddCircleIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { DragDotsIcon } from "./icons/DragDotsIcon";
import { HtmlErrorIcon } from "./icons/HtmlErrorIcon";

interface SidebarSectionGroupProps {
  section: any;
  /** Called when a widget title is clicked */
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
  const sectionId = section.id;
  const hasErrors = sectionErrors.length > 0;
  const isAnyWidgetSelected =
    selectedWidgetId !== null &&
    Array.isArray(section.widgets) &&
    section.widgets.some((widget: any) => widget.id === selectedWidgetId);

  const firstWidget = section.widgets?.[0];
  const groupClassName = [
    styles.group,
    hasErrors ? styles.groupError : null,
    !hasErrors && isAnyWidgetSelected ? styles.groupSelected : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleCardClick = () => {
    if (firstWidget && onWidgetClick) {
      onWidgetClick(firstWidget.id, section.id);
    }
  };

  return (
    <div className={groupClassName} style={dragStyle}>
      {firstWidget && onWidgetClick && (
        <a
          href="#"
          className={styles.stretchedLink}
          onClick={(e) => {
            e.preventDefault();
            handleCardClick();
          }}
          aria-label={`Select ${firstWidget.name || firstWidget.type || "section"}`}
        />
      )}
      <div className={styles.dragHandle} {...dragListeners} {...dragAttributes}>
        <DragDotsIcon />
      </div>
      <div className={styles.sectionContent}>
        <div className={styles.content}>
          {section.widgets?.map((widget: any) => {
            const isWidgetSelected = selectedWidgetId === widget.id;
            const widgetTitle = widget.name || widget.type || sectionId;

            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              onWidgetClick?.(widget.id, section.id);
            };

            return (
              <h2
                key={widget.id}
                className={styles.title}
                onClick={handleClick}
                style={{
                  cursor: onWidgetClick ? "pointer" : "default",
                  ...(isWidgetSelected
                    ? { color: "#1e40af", fontWeight: 600 }
                    : {}),
                }}
              >
                {widgetTitle}
              </h2>
            );
          })}
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
      <div className={styles.headerActions}>
        {hasErrors && (
          <div
            className={styles.errorIcon}
            title={`${sectionErrors.length} HTML validation error${sectionErrors.length !== 1 ? "s" : ""}`}
          >
            <HtmlErrorIcon />
          </div>
        )}
        {onClose && isInLibrary && (
          <IconButton
            icon={<CloseIcon />}
            variant="ghost"
            size="sm"
            shape="square"
            onClick={() => onClose(section.id)}
            aria-label="Close"
          />
        )}
      </div>
    </div>
  );
};
