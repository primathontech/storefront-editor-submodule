import React, { useState } from "react";
import { useDualTranslationStore } from "../../stores/dualTranslationStore";
import { useEditorState } from "../../stores/useEditorState";
import { useToast } from "@/ui/context/toast/ToastContext";

interface EditorHeader2Props {
  theme?: any;
  selectedTemplateId?: string | null;
  onTemplateChange?: (templateMeta: any) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

// Feature flag: only save to API when explicitly enabled
const isEditorChangesEnabled = () => {
  const flag = process.env.NEXT_PUBLIC_ENABLE_EDITOR_CHANGES;
  return String(flag).toLowerCase() === "true";
};

const EditorHeader2: React.FC<EditorHeader2Props> = ({
  theme,
  selectedTemplateId,
  onTemplateChange,
  onSave,
  isSaving = false,
}) => {
  const {
    saveTranslations,
    isSaving: isTranslationSaving,
    hasUnsavedChanges,
  } = useDualTranslationStore();
  const { device, setDevice, mode, setMode, validateAllHtml } =
    useEditorState();

  const [isValidating, setIsValidating] = useState(false);
  const { addToast } = useToast();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplateId = e.target.value;
    if (!selectedTemplateId || !theme || !onTemplateChange) {
      return;
    }

    for (const group of theme.templateStructure) {
      const foundTemplate = group.templates?.find(
        (t: any) => t.id === selectedTemplateId
      );
      if (foundTemplate) {
        onTemplateChange(foundTemplate);
        break;
      }
    }
  };

  const selectedTemplate = theme?.templateStructure
    ?.flatMap((group: any) => group.templates || [])
    .find((template: any) => template.id === selectedTemplateId);

  const handleSave = async () => {
    // Validate all HTML before saving
    setIsValidating(true);
    try {
      await validateAllHtml();

      // Check errors after validation (get fresh state)
      const state = useEditorState.getState();
      const errorsBySection = state.htmlValidationErrors;
      const sectionsWithErrors = Object.entries(errorsBySection).filter(
        ([_, errors]) => errors.length > 0
      );

      if (sectionsWithErrors.length > 0) {
        const totalErrors = sectionsWithErrors.reduce(
          (sum, [_, errors]) => sum + errors.length,
          0
        );
        addToast({
          type: "error",
          title: "HTML Validation Failed",
          message: `Found ${totalErrors} error${totalErrors !== 1 ? "s" : ""} in ${sectionsWithErrors.length} section${sectionsWithErrors.length !== 1 ? "s" : ""}. Please fix errors before saving.`,
          duration: 5000,
        });
        return; // Don't save if errors exist
      }

      if (selectedTemplate?.isDynamic) {
        // Handle template save
        onSave?.();
        // For dynamic templates, save to template-specific file
        await saveTranslations(theme?.id, selectedTemplateId!);
      } else {
        // Handle translation save
        await saveTranslations(theme?.id, selectedTemplateId!);
      }
    } catch (error) {
      console.error("Validation error:", error);
      addToast({
        type: "error",
        title: "Validation Error",
        message: "An error occurred during validation. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const editorChangesEnabled = isEditorChangesEnabled();
  const isSaveDisabled =
    !editorChangesEnabled ||
    isSaving ||
    isTranslationSaving ||
    isValidating ||
    (selectedTemplate?.isDynamic ? false : !hasUnsavedChanges);

  const saveButtonTitle = !editorChangesEnabled
    ? "Enable editor changes to allow saving"
    : !selectedTemplate?.isDynamic && !hasUnsavedChanges
      ? "Make some changes before saving"
      : "Save changes";

  const DEVICES = ["desktop", "tablet", "mobile", "fullscreen"] as const;
  const MODES = ["edit", "preview"] as const;

  return (
    <header className="w-full bg-editor-surface border-b border-editor-border flex items-center justify-between px-6 h-14 shadow-sm z-10">
      {/* Left side - Navigation and Theme Info */}
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-editor-text">
          Theme: {theme?.name || theme?.id}
        </span>

        {/* Template Dropdown */}
        {theme?.templateStructure?.length > 0 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="template-select"
              className="text-sm text-editor-text-muted"
            >
              Template:
            </label>
            <select
              id="template-select"
              className="px-3 py-1 border border-editor-border rounded text-sm min-w-[300px] bg-editor-surface text-editor-text"
              value={selectedTemplateId || ""}
              onChange={handleSelectChange}
              aria-label="Select template to edit"
            >
              <option value="" disabled>
                Select template...
              </option>
              {theme.templateStructure.map((group: any) => (
                <optgroup key={group.id} label={`📁 ${group.name}`}>
                  {group.templates?.map((template: any) => (
                    <option key={template.id} value={template.id}>
                      📄 {template.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side - Device and Mode Controls */}
      <div className="flex items-center gap-6">
        {/* Unified Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            isSaveDisabled
              ? "bg-editor-surface-muted text-editor-text-muted cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
          title={saveButtonTitle}
        >
          {isValidating
            ? "Validating..."
            : isSaving || isTranslationSaving
              ? "Saving..."
              : "Save"}
        </button>

        <div className="flex gap-1">
          {DEVICES.map((d) => (
            <button
              key={d}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                device === d
                  ? "bg-editor-accent text-white"
                  : "bg-editor-surface-muted text-editor-text-muted"
              } cursor-pointer`}
              onClick={() => setDevice(d)}
              title={`Switch to ${d.charAt(0).toUpperCase() + d.slice(1)} view`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                mode === m
                  ? "bg-green-600 text-white"
                  : "bg-editor-surface-muted text-editor-text-muted"
              } cursor-pointer`}
              onClick={() => setMode(m)}
              title={`Switch to ${m.charAt(0).toUpperCase() + m.slice(1)} mode`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default EditorHeader2;
