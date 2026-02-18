"use client";

import React from "react";
import { useEditorState } from "../../stores/useEditorState";
import styles from "./TemplateSwitchDropdown.module.css";

interface TemplateSwitchDropdownProps {
  theme?: any;
  selectedTemplateId?: string | null;
  onTemplateChange?: (templateMeta: any) => void;
  className?: string;
}

export const TemplateSwitchDropdown: React.FC<TemplateSwitchDropdownProps> = ({
  theme,
  selectedTemplateId,
  onTemplateChange,
  className = "",
}) => {
  const { resetEditorState } = useEditorState();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextTemplateId = e.target.value;
    if (!nextTemplateId || !theme) {
      return;
    }

    // Find the template in the theme structure
    for (const group of theme.templateStructure) {
      const foundTemplate = group.templates?.find(
        (t: any) => t.id === nextTemplateId
      );
      if (foundTemplate) {
        // Reset editor state before switching templates
        resetEditorState();
        // Notify parent to update templateMeta
        onTemplateChange?.(foundTemplate);
        break;
      }
    }
  };

  // Don't render if no theme structure available
  if (!theme?.templateStructure?.length) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <label htmlFor="template-select" className={styles.label}>
        Template
      </label>
      <select
        id="template-select"
        className={styles.select}
        value={selectedTemplateId || ""}
        onChange={handleSelectChange}
        aria-label="Select template to edit"
      >
        <option value="" disabled>
          Select template...
        </option>
        {theme.templateStructure.map((group: any) => (
          <optgroup key={group.id} label={group.name}>
            {group.templates?.map((template: any) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};
