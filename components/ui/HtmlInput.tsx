"use client";

import React, { useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSidebarWidth } from "../../context/SidebarWidthContext";
import { useEditorState } from "../../stores/useEditorState";

// Lazy load the entire editor component with all heavy dependencies in one chunk
const HtmlEditorWithValidation = dynamic(
  () =>
    import("./HtmlEditor").then((mod) => ({
      default: mod.HtmlEditorWithValidation,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          height: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading editor...
      </div>
    ),
  }
);

export interface HtmlInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  sectionId?: string;
}

export const HtmlInput: React.FC<HtmlInputProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  placeholder = "Enter HTML code...",
  sectionId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { setWidth } = useSidebarWidth();
  const { htmlValidationErrors } = useEditorState();

  // Get errors for this section from store (single source of truth)
  const validationErrors = sectionId
    ? htmlValidationErrors[sectionId] || []
    : [];

  useEffect(() => {
    if (isExpanded) {
      setWidth(600); // Expand sidebar to 600px
    } else {
      setWidth(320); // Reset to default 320px
    }

    // Cleanup: reset width when component unmounts
    return () => {
      setWidth(320);
    };
  }, [isExpanded, setWidth]);

  const getPreviewText = useCallback(
    (html: string) => {
      if (!html) return placeholder;
      const div = document.createElement("div");
      div.innerHTML = html;
      const text = div.textContent || div.innerText || "";
      if (text.length > 0) {
        return text.length > 100 ? text.substring(0, 100) + "..." : text;
      }
      const tagCount = (html.match(/<[^>]+>/g) || []).length;
      return tagCount > 0
        ? `HTML content (${tagCount} tag${tagCount !== 1 ? "s" : ""})`
        : placeholder;
    },
    [placeholder]
  );

  return (
    <div style={{ marginBottom: "1rem" }}>
      {label && (
        <label
          style={{
            fontWeight: 500,
            display: "block",
            marginBottom: "0.5rem",
            fontSize: "12px",
          }}
        >
          {label}
        </label>
      )}

      {!isExpanded ? (
        <div
          style={{
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            padding: "8px 12px",
            minHeight: "40px",
            backgroundColor: "#f9fafb",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "14px",
            lineHeight: "1.4",
            color: value ? "#374151" : "#9ca3af",
          }}
          onClick={disabled ? undefined : () => setIsExpanded(true)}
        >
          {getPreviewText(value)}
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "12px", fontWeight: 500, color: "#374151" }}
            >
              Code
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>
          <div style={{ height: "500px" }}>
            <HtmlEditorWithValidation
              value={value}
              onChange={onChange}
              disabled={disabled}
              sectionId={sectionId}
            />
          </div>
          {validationErrors.length > 0 && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px 12px",
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                fontSize: "12px",
              }}
            >
              <strong>Errors:</strong>
              <ul style={{ marginTop: "4px", paddingLeft: "18px" }}>
                {validationErrors.map((e, idx) => (
                  <li key={idx}>
                    Line {e.line}, Column {e.column}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
