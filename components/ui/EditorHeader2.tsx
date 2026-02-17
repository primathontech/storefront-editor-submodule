import React, { useState } from "react";
import { useDualTranslationStore } from "../../stores/dualTranslationStore";
import { useEditorState } from "../../stores/useEditorState";
import { useToast } from "@/ui/context/toast/ToastContext";
import { Button, IconButton } from "./design-system";
import { PreviewIcon } from "./icons/PreviewIcon";
import { EditIcon } from "./icons/EditIcon";
import { HeaderHomeIcon } from "./icons/HeaderHomeIcon";
import { HeaderMonitorIcon } from "./icons/HeaderMonitorIcon";
import { HeaderTabletIcon } from "./icons/HeaderTabletIcon";
import { HeaderMobileIcon } from "./icons/HeaderMobileIcon";
import { HeaderStackedIcon } from "./icons/HeaderStackedIcon";
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

  const DEVICES = [
    { id: "desktop", label: "Desktop", Icon: HeaderMonitorIcon },
    { id: "tablet", label: "Tablet", Icon: HeaderTabletIcon },
    { id: "mobile", label: "Mobile", Icon: HeaderMobileIcon },
    { id: "fullscreen", label: "Fullscreen", Icon: HeaderStackedIcon },
  ] as const;
  return (
    <header className={styles.header}>
      {/* Left side - Home icon + Theme name */}
      <div className={styles["left-container"]}>
        <IconButton
          icon={<HeaderHomeIcon />}
          size="md"
          variant="ghost"
          shape="square"
          aria-label="Back to themes"
          title="Back to themes"
        />
        <span className={styles["theme-name"]}>{theme?.name || theme?.id}</span>

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

      {/* Center - Device Controls */}
      <div className={styles["center-container"]}>
        <div className={styles["device-group"]}>
          {DEVICES.map(({ id, label, Icon }) => (
            <IconButton
              key={id}
              icon={<Icon />}
              size="md"
              variant="ghost"
              shape="square"
              onClick={() => setDevice(id as typeof device)}
              aria-pressed={device === id}
              aria-label={`Switch to ${label} view`}
              title={`Switch to ${label} view`}
              className={`${styles["device-button"]} ${
                device === id
                  ? styles["device-button-active"]
                  : styles["device-button-inactive"]
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right side - Preview/Edit toggle and Save Button */}
      <div className={styles["right-container"]}>
        <div className={styles["action-buttons-container"]}>
          <Button
            variant="secondary"
            size="md"
            leftIcon={mode === "preview" ? <EditIcon /> : <PreviewIcon />}
            onClick={() => setMode(mode === "preview" ? "edit" : "preview")}
            style={{ width: "122px" }}
          >
            {mode === "preview" ? "Edit" : "Preview"}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isSaveDisabled}
            loading={isValidating || isSaving || isTranslationSaving}
            title={saveButtonTitle}
            style={{ width: "100px" }}
          >
            {isValidating
              ? "Validating..."
              : isSaving || isTranslationSaving
                ? "Saving..."
                : "Save"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default EditorHeader2;
