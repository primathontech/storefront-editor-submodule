import { useToast } from "@/ui/context/toast/ToastContext";
import React, { useState } from "react";
import { useDualTranslationStore } from "../../stores/dualTranslationStore";
import { useEditorState } from "../../stores/useEditorState";
import { Button, IconButton } from "./design-system";
import styles from "./EditorHeader2.module.css";
import { EditIcon } from "./icons/EditIcon";
import { HeaderHomeIcon } from "./icons/HeaderHomeIcon";
import { HeaderMobileIcon } from "./icons/HeaderMobileIcon";
import { HeaderMonitorIcon } from "./icons/HeaderMonitorIcon";
import { HeaderStackedIcon } from "./icons/HeaderStackedIcon";
import { HeaderTabletIcon } from "./icons/HeaderTabletIcon";
import { PreviewIcon } from "./icons/PreviewIcon";
import { TemplateSwitchDropdown } from "./TemplateSwitchDropdown";

interface EditorHeader2Props {
  theme?: any;
  onSave?: () => void;
  isSaving?: boolean;
  selectedTemplateId?: string | null;
  onTemplateChange?: (templateMeta: any) => void;
}

// Feature flag: only save to API when explicitly enabled
const isEditorChangesEnabled = () => {
  const flag = process.env.NEXT_PUBLIC_ENABLE_EDITOR_CHANGES;
  return String(flag).toLowerCase() === "true";
};

const EditorHeader2: React.FC<EditorHeader2Props> = ({
  theme,
  onSave,
  isSaving = false,
  selectedTemplateId,
  onTemplateChange,
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
        await saveTranslations(theme?.id, selectedTemplate?.id);
      } else {
        // Handle translation save
        await saveTranslations(theme?.id, selectedTemplate?.id);
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
        <div className={styles.divider} />
        <span className={styles["theme-name"]}>{theme?.name || theme?.id}</span>
      </div>

      {/* Center - Template Dropdown and Device Controls */}
      <div className={styles["center-container"]}>
        <div className={styles["template-dropdown-wrapper"]}>
          <TemplateSwitchDropdown
            theme={theme}
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={onTemplateChange}
          />
        </div>
      </div>

      {/* Right side - Preview/Edit toggle and Save Button */}
      <div className={styles["right-container"]}>
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
            style={{ minWidth: "100px" }}
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
