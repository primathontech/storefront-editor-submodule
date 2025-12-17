import React from "react";
import Dialog from "./Dialog";
import { availableSectionsRegistry } from "@/registries/available-sections-registry";

type SectionOption = {
  value: string;
  label: string;
  previewImage?: string;
  previewAlt?: string;
};

interface SectionLibraryDialogProps {
  open: boolean;
  onConfirm: (selectedKey: string | null) => void;
  onClose: () => void;
}

const getAvailableSectionOptions = (): SectionOption[] => {
  const entries = availableSectionsRegistry.availableSections || {};
  return Object.entries(entries).map(([key, section]: [string, any]) => ({
    value: key,
    label: section.name,
    previewImage: section.previewImage,
    previewAlt: section.previewAlt ?? section.name,
  }));
};

export const SectionLibraryDialog: React.FC<SectionLibraryDialogProps> = ({
  open,
  onConfirm,
  onClose,
}) => {
  const options = getAvailableSectionOptions();
  const [selectedLibraryKey, setSelectedLibraryKey] = React.useState<
    string | null
  >(null);

  const selected =
    (selectedLibraryKey &&
      options.find((option) => option.value === selectedLibraryKey)) ||
    null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add section"
      size="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedLibraryKey)}
            disabled={!selected}
            className="px-4 py-2 rounded text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </>
      }
    >
      <p className="mb-3 text-xs text-gray-500">
        Pick a section on the left to see its preview. Click Done to add it to
        the page.
      </p>
      <div className="flex gap-4">
        {/* Left: section list */}
        <div className="w-1/3 space-y-1 h-[700px] overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === selectedLibraryKey;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedLibraryKey(option.value)}
                className={[
                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md border transition-colors",
                  isSelected
                    ? "border-green-500 bg-green-50"
                    : "border-gray-100 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                <span className="truncate">{option.label}</span>
                <span className="text-[11px] text-gray-400 uppercase tracking-wide">
                  Section
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: preview */}
        <div className="flex-1 border border-dashed border-gray-200 rounded-md p-3 flex flex-col bg-gray-50">
          {selected ? (
            <>
              <div className="mb-2 text-xs font-medium text-gray-500">
                {selected.label}
              </div>
              <div className="flex-1 flex items-center justify-center">
                {selected.previewImage ? (
                  <div className="w-full max-w-full max-h-72 rounded-md border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.previewImage}
                      alt={selected.previewAlt}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-8">
                    No preview image configured yet.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-400 text-center py-8">
              Select a section on the left to see its preview.
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
