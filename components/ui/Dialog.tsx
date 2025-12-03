"use client";

import * as React from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  if (!open) return null;

  const maxWidthClass =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full ${maxWidthClass} rounded-lg bg-white shadow-xl border border-gray-200`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {title && (
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
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

        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dialog;
