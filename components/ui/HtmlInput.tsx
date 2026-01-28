"use client";

import React, { useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRightSidebarWidth } from "../../context/RightSidebarWidthContext";
import { useEditorState } from "../../stores/useEditorState";
import { AIAPI } from "../../services/ai";

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
  const [aiMessage, setAiMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiImageFile, setAiImageFile] = useState<File | null>(null);
  const { setWidth } = useRightSidebarWidth();
  const { htmlValidationErrors } = useEditorState();

  // Get errors for this section from store (single source of truth)
  const validationErrors = sectionId
    ? htmlValidationErrors[sectionId] || []
    : [];

  useEffect(() => {
    if (isExpanded) {
      setWidth(600); // Expand right sidebar to 600px
    } else {
      setWidth(400); // Reset to default 400px
    }

    // Cleanup: reset width when component unmounts
    return () => {
      setWidth(400);
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

  const handleAiGenerate = useCallback(async () => {
    if (!aiMessage.trim() || isGenerating || disabled) return;

    setIsGenerating(true);
    try {
      const cleanHtml = await AIAPI.generateCustomHtmlSnippet({
        userMessage: aiMessage,
        currentHtml: value,
        imageFile: aiImageFile,
      });

      if (cleanHtml) {
        onChange(cleanHtml);
        setAiMessage("");
      }
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [aiMessage, isGenerating, disabled, onChange, value, aiImageFile]);

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
          <div
            style={{
              padding: "12px",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 500,
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              AI Assistant
            </div>
            <div
              style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
            >
              <textarea
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAiGenerate();
                  }
                }}
                placeholder="Describe the HTML/CSS/JS you want to generate..."
                disabled={isGenerating || disabled}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                  minHeight: "60px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={!aiMessage.trim() || isGenerating || disabled}
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    !aiMessage.trim() || isGenerating || disabled
                      ? "#9ca3af"
                      : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    !aiMessage.trim() || isGenerating || disabled
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
            <div
              style={{
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11px",
                color: "#4b5563",
              }}
            >
              <label
                style={{
                  cursor: isGenerating || disabled ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                }}
              >
                Attach image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={isGenerating || disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      setAiImageFile(null);
                      return;
                    }
                    if (!file.type.startsWith("image/")) {
                      console.error("Selected file is not an image");
                      setAiImageFile(null);
                      return;
                    }
                    setAiImageFile(file);
                  }}
                />
              </label>
              {aiImageFile && (
                <span
                  style={{
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    maxWidth: "200px",
                  }}
                  title={aiImageFile.name}
                >
                  {aiImageFile.name}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
