import React from "react";
import { useDualTranslationStore } from "../../stores/dualTranslationStore";
import { useEditorState } from "../../stores/useEditorState";

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
  const { device, setDevice, mode, setMode } = useEditorState();

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
    if (selectedTemplate?.isDynamic) {
      // Handle template save
      onSave?.();
      // For dynamic templates, save to template-specific file
      await saveTranslations(theme?.id, selectedTemplateId!);
    } else {
      // Handle translation save
      await saveTranslations(theme?.id, selectedTemplateId!);
    }
  };

  const editorChangesEnabled = isEditorChangesEnabled();
  const isSaveDisabled =
    !editorChangesEnabled ||
    isSaving ||
    isTranslationSaving ||
    (selectedTemplate?.isDynamic ? false : !hasUnsavedChanges);

  const saveButtonTitle = !editorChangesEnabled
    ? "Enable editor changes to allow saving"
    : !selectedTemplate?.isDynamic && !hasUnsavedChanges
      ? "Make some changes before saving"
      : "Save changes";

  const DEVICES = ["desktop", "tablet", "mobile", "fullscreen"] as const;
  const MODES = ["edit", "preview"] as const;

  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-6 h-14 shadow-sm z-10">
      {/* Left side - Navigation and Theme Info */}
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold">
          Theme: {theme?.name || theme?.id}
        </span>

        {/* Template Dropdown */}
        {theme?.templateStructure?.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="template-select" className="text-sm text-gray-600">
              Template:
            </label>
            <select
              id="template-select"
              className="px-3 py-1 border rounded text-sm min-w-[300px]"
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
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
          title={saveButtonTitle}
        >
          {isSaving || isTranslationSaving ? "Saving..." : "Save"}
        </button>

        <div className="flex gap-1">
          {DEVICES.map((d) => (
            <button
              key={d}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                device === d
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
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
                  : "bg-gray-200 text-gray-700"
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
