import React, { useState } from "react";
import { Input } from "./design-system";
import styles from "./FAQInput.module.css";
import { TrashRedIcon } from "./icons/TrashIcon";

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
    <div className={styles.root}>
      {label && <span className={styles.label}>{label}</span>}

      <div className={styles.items}>
        {items.map((item, index) => (
          <div key={index} className={styles.itemCard}>
            <div className={styles.itemHeader}>
              <span className={styles.itemTitle}>Item {index + 1}</span>
              {showControls && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={disabled}
                  className={styles.removeButton}
                >
                  <TrashRedIcon />
                </button>
              )}
            </div>

            <div className={styles.fields}>
              <Input
                label="Question"
                labelVariant="subtle"
                type="text"
                size="md"
                value={item.question}
                onChange={(e) => updateItem(index, "question", e.target.value)}
                disabled={disabled}
                placeholder="Enter Question"
                fullWidth
              />
              <Input
                label="Answer"
                labelVariant="subtle"
                type="text"
                size="md"
                value={item.answer}
                onChange={(e) => updateItem(index, "answer", e.target.value)}
                disabled={disabled}
                placeholder="Enter Answer"
                fullWidth
              />
            </div>
          </div>
        ))}
      </div>

      {showControls && (
        <div className={styles.addRow}>
          <button
            type="button"
            onClick={addItem}
            disabled={disabled}
            className={styles.addButton}
          >
            + Add FAQ Item
          </button>
        </div>
      )}
    </div>
  );
};
