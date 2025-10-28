import React, { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQInputProps {
  value: FAQItem[];
  onChange: (value: FAQItem[]) => void;
  label?: string;
  disabled?: boolean;
  showControls?: boolean;
}

export const FAQInput: React.FC<FAQInputProps> = ({
  value = [],
  onChange,
  label = "FAQ Items",
  disabled = false,
  showControls = false,
}) => {
  const [items, setItems] = useState<FAQItem[]>(value);

  const addItem = () => {
    const newItems = [...items, { question: "", answer: "" }];
    setItems(newItems);
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(newItems);
  };

  const updateItem = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(newItems);
    onChange(newItems);
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      {label && (
        <label
          style={{ fontWeight: 500, display: "block", marginBottom: "0.5rem" }}
        >
          {label}
        </label>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontWeight: 500, color: "#64748b" }}>
              FAQ Item {index + 1}
            </span>
            {showControls && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={disabled}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                Remove
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Question"
            value={item.question}
            disabled={disabled}
            onChange={(e) => updateItem(index, "question", e.target.value)}
            style={{
              width: "100%",
              marginBottom: "0.5rem",
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
          />

          <textarea
            placeholder="Answer"
            value={item.answer}
            disabled={disabled}
            onChange={(e) => updateItem(index, "answer", e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              resize: "vertical",
            }}
          />
        </div>
      ))}

      {showControls && (
        <button
          type="button"
          onClick={addItem}
          disabled={disabled}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
          }}
        >
          + Add FAQ Item
        </button>
      )}
    </div>
  );
};
