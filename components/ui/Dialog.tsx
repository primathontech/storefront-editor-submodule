"use client";

import * as React from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  headerAction,
  size = "md",
}) => {
  if (!open) return null;

  const maxWidthClass =
    size === "sm"
      ? "max-w-sm"
      : size === "lg"
        ? "max-w-4xl"
        : size === "xl"
          ? "max-w-7xl"
          : "max-w-md";

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full ${maxWidthClass} rounded-lg bg-editor-surface shadow-xl border border-editor-border`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <div className="flex items-center gap-4 flex-1">
            {title &&
              (typeof title === "string" ? (
                <h2 className="text-sm font-semibold text-editor-text">
                  {title}
                </h2>
              ) : (
                <div className="flex items-center gap-2">{title}</div>
              ))}
            {headerAction && <div className="ml-auto mr-2">{headerAction}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-editor-text-muted hover:text-editor-text hover:bg-editor-surface-muted rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
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

        <div className="max-h-[80vh] overflow-y-auto px-4 py-3">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-editor-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dialog;
