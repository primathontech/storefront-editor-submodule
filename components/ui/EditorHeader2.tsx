import React, { useState } from "react";
import { useDualTranslationStore } from "../../stores/dualTranslationStore";
import { useEditorState } from "../../stores/useEditorState";
import { useToast } from "@/ui/context/toast/ToastContext";
import styles from "./EditorHeader2.module.css";

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
    <header className={styles.header}>
      {/* Left side - Navigation and Theme Info */}
      <div className={styles["left-container"]}>
        <span className={styles["theme-name"]}>
          Theme: {theme?.name || theme?.id}
        </span>

        {/* Template Dropdown */}
        {theme?.templateStructure?.length > 0 && (
          <div className={styles["template-container"]}>
            <label
              htmlFor="template-select"
              className={styles["template-label"]}
            >
              Template:
            </label>
            <select
              id="template-select"
              className={styles["template-select"]}
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
      <div className={styles["right-container"]}>
        {/* Unified Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className={styles["save-button"]}
          title={saveButtonTitle}
        >
          {isValidating
            ? "Validating..."
            : isSaving || isTranslationSaving
              ? "Saving..."
              : "Save"}
        </button>

        <div className={styles["button-group"]}>
          {DEVICES.map((d) => (
            <button
              key={d}
              className={`${styles["device-button"]} ${
                device === d
                  ? styles["device-button-active"]
                  : styles["device-button-inactive"]
              }`}
              onClick={() => setDevice(d)}
              title={`Switch to ${d.charAt(0).toUpperCase() + d.slice(1)} view`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles["button-group"]}>
          {MODES.map((m) => (
            <button
              key={m}
              className={`${styles["mode-button"]} ${
                mode === m
                  ? styles["mode-button-active"]
                  : styles["mode-button-inactive"]
              }`}
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
