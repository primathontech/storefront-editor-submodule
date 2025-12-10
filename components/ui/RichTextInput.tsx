import React, { useRef, useCallback, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

// Import ReactQuill CSS
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-32 bg-gray-100 animate-pulse rounded">
      Loading ReactQuill...
    </div>
  ),
});

export interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
}

// Move Modal component outside to prevent recreation on every render
const Modal = React.memo<{
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}>(({ value, onChange, onSave, onCancel, label, placeholder, disabled }) => {
  // Quill modules configuration - memoized to prevent recreation
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  // Quill formats configuration - memoized to prevent recreation
  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "list",
      "bullet",
      "color",
      "background",
      "align",
      "link",
      "clean",
    ],
    []
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "1000px",
          height: "85%",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
            {label || "Edit Content"}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div
          style={{
            flex: 1,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              height: "100%",
            }}
            className="modal-quill-editor"
          >
            <ReactQuill
              value={value}
              onChange={onChange}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
              readOnly={disabled}
              theme="snow"
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              background: "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
});

Modal.displayName = "Modal";

export const RichTextInput: React.FC<RichTextInputProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  placeholder = "Enter content...",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState(value);

  // Keep track of the last value to detect actual changes
  const lastValueRef = useRef<string>(value);

  // Only call onChange when content actually changes
  const handleChange = useCallback(
    (newValue: string) => {
      // Normalize the values for comparison (trim whitespace)
      const normalizedNewValue = newValue.trim();
      const normalizedLastValue = lastValueRef.current.trim();

      // Only update if the content has actually changed
      if (normalizedNewValue !== normalizedLastValue) {
        lastValueRef.current = newValue;
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Update the ref when the value prop changes (from external updates)
  React.useEffect(() => {
    lastValueRef.current = value;
    setModalValue(value);
  }, [value]);

  // Handle modal open
  const handleOpenModal = useCallback(() => {
    setModalValue(value);
    setIsModalOpen(true);
  }, [value]);

  // Handle modal save
  const handleSaveModal = useCallback(() => {
    handleChange(modalValue);
    setIsModalOpen(false);
  }, [handleChange, modalValue]);

  // Handle modal cancel
  const handleCancelModal = useCallback(() => {
    setModalValue(value);
    setIsModalOpen(false);
  }, [value]);

  // Memoize the modal change handler to prevent re-renders
  const handleModalChange = useCallback((newValue: string) => {
    setModalValue(newValue);
  }, []);

  // Strip HTML tags for preview
  const getPreviewText = useCallback(
    (html: string) => {
      if (!html) {
        return placeholder;
      }
      const div = document.createElement("div");
      div.innerHTML = html;
      const text = div.textContent || div.innerText || "";
      return text.length > 100 ? text.substring(0, 100) + "..." : text;
    },
    [placeholder]
  );

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        {label && (
          <label
            style={{
              fontWeight: 500,
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            {label}
          </label>
        )}

        {/* Compact preview in sidebar */}
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
          onClick={disabled ? undefined : handleOpenModal}
        >
          {getPreviewText(value)}
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={handleOpenModal}
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "#3b82f6",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Edit content
          </button>
        )}
      </div>

      {/* Modal rendered at document body level */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <Modal
            value={modalValue}
            onChange={handleModalChange}
            onSave={handleSaveModal}
            onCancel={handleCancelModal}
            label={label}
            placeholder={placeholder}
            disabled={disabled}
          />,
          document.body
        )}

      {/* Add CSS for ReactQuill */}
      <style jsx global>{`
        .modal-quill-editor .ql-container {
          flex: 1;
          min-height: 0;
        }

        .modal-quill-editor .ql-editor {
          min-height: 200px;
          font-size: 14px;
          line-height: 1.6;
        }

        .modal-quill-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-bottom: none;
          border-radius: 4px 4px 0 0;
        }

        .modal-quill-editor .ql-container {
          border: 1px solid #ccc;
          border-top: none;
          border-radius: 0 0 4px 4px;
        }

        .modal-quill-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </>
  );
};
