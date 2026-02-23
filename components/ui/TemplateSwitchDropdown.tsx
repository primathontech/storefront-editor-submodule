"use client";

import React, { useMemo } from "react";
import { useEditorState } from "../../stores/useEditorState";
import { Dropdown, type DropdownOptionGroup } from "./dropdown/Dropdown";

interface TemplateSwitchDropdownProps {
  theme?: any;
  selectedTemplateId?: string | null;
  onTemplateChange?: (templateMeta: any) => void;
}

export const TemplateSwitchDropdown: React.FC<TemplateSwitchDropdownProps> = ({
  theme,
  selectedTemplateId,
  onTemplateChange,
}) => {
  const { resetEditorState } = useEditorState();

  // Convert theme structure to dropdown option groups
  const optionGroups: DropdownOptionGroup[] = useMemo(() => {
    if (!theme?.templateStructure?.length) {
      return [];
    }

    return theme.templateStructure.map((group: any) => ({
      label: group.name,
      options:
        group.templates?.map((template: any) => ({
          value: template.id,
          label: template.name,
        })) || [],
    }));
  }, [theme]);

  // Helper to find template by ID
  const findTemplate = (templateId: string) => {
    if (!theme?.templateStructure) {
      return null;
    }

    for (const group of theme.templateStructure) {
      const found = group.templates?.find((t: any) => t.id === templateId);
      if (found) {
        return found;
      }
    }
    return null;
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextTemplateId = e.target.value;
    if (!nextTemplateId) {
      return;
    }

    const foundTemplate = findTemplate(nextTemplateId);
    if (foundTemplate) {
      resetEditorState();
      onTemplateChange?.(foundTemplate);
      // Blur the select to remove focus state after template change
      e.target.blur();
    }
  };

  if (!theme?.templateStructure?.length || optionGroups.length === 0) {
    return null;
  }

  return (
    <Dropdown
      id="template-select"
      variant="ghost"
      size="sm"
      value={selectedTemplateId || ""}
      onChange={handleSelectChange}
      groups={optionGroups}
      aria-label="Select template to edit"
      fullWidth
      showChevron
    />
  );
};
