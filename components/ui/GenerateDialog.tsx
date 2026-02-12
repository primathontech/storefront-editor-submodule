import React, { useState } from "react";
import styles from "./GenerateDialog.module.css";
import { SparkleIcon } from "./SectionLibraryDialog";
import { useImageAttachment } from "./useImageAttachment";
import { PromptTextarea } from "./PromptTextarea";

interface GenerateDialogProps {
  onGenerate: (intent: string, imageFile?: File | null) => void;
}

export const ImageUploadIcon: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M0 0h24v24H0V0z" fill="none" />
    <path d="M18 20H4V6h9V4H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9h-2v9zm-7.79-3.17l-1.96-2.36L5.5 18h11l-3.54-4.71zM20 4V1h-2v3h-3c.01.01 0 2 0 2h3v2.99c.01.01 2 0 2 0V6h3V4h-3z" />
  </svg>
);

const ActionButton: React.FC<{
  label: string;
  onGenerate: (intent: string) => void;
}> = ({ label, onGenerate }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const trimmed = label.trim();
    if (!trimmed) return;
    // Fixed buttons send only the intent, no image attachment
    onGenerate(trimmed);
  };

  return (
    <button
      type="button"
      className={styles["action-button"]}
      onClick={handleClick}
    >
      {label}
    </button>
  );
};

export const GenerateDialog: React.FC<GenerateDialogProps> = ({
  onGenerate,
}) => {
  const [prompt, setPrompt] = useState("");
  const {
    file: imageFile,
    previewUrl: imagePreviewUrl,
    fileInputRef,
    openFilePicker,
    handleFileChange,
    clearImage,
  } = useImageAttachment();

  const handlePromptSend = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onGenerate(trimmed, imageFile);
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to submit, Shift+Enter for newline (simple, stable UX)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePromptSend();
    }
  };

  return (
    <div className={styles["generate-content"]}>
      <div className={styles["title-container"]}>
        <div className={styles["sparkle-icon"]}>
          <SparkleIcon className={styles["sparkle-main"]} />
          <SparkleIcon
            className={`${styles["sparkle-small"]} ${styles["sparkle-top-left"]}`}
          />
          <SparkleIcon
            className={`${styles["sparkle-small"]} ${styles["sparkle-bottom-right"]}`}
          />
        </div>
        <h2>What's on your mind, Write Here</h2>
      </div>

      {/* Action buttons */}
      <div className={styles["action-buttons"]}>
        <ActionButton label="Create Header" onGenerate={onGenerate} />
        <ActionButton label="Create Hero Section" onGenerate={onGenerate} />
        <ActionButton label="Create Banner" onGenerate={onGenerate} />
      </div>

      {/* Design area */}
      <div className={styles["design-area"]}>
        <div className={styles["prompt-wrapper"]}>
          {imagePreviewUrl && (
            <div className={styles["image-preview-container"]}>
              <div className={styles["image-preview-wrapper"]}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt={imageFile?.name || "Attached image"}
                  className={styles["image-preview"]}
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className={styles["image-remove-button"]}
                  aria-label="Remove attached image"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <PromptTextarea
            value={prompt}
            onChange={setPrompt}
            imagePreviewUrl={imagePreviewUrl ?? undefined}
            rows={3}
            onKeyDown={handlePromptKeyDown}
          />
        </div>
        <div className={styles["design-controls"]}>
          <button
            type="button"
            className={styles["add-button"]}
            aria-label="Upload image"
            onClick={openFilePicker}
          >
            <ImageUploadIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles["file-input"]}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className={styles["arrow-button"]}
            aria-label="Generate"
            onClick={(e) => {
              e.stopPropagation();
              handlePromptSend();
            }}
            disabled={!prompt.trim()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="17"
              viewBox="0 0 12 17"
              fill="none"
            >
              <path
                d="M4.99262 0.2197C5.28551 -0.0731945 5.76039 -0.0731945 6.05328 0.2197L10.8262 4.99267C11.1191 5.28556 11.1191 5.76044 10.8262 6.05333C10.5334 6.34622 10.0585 6.34622 9.76559 6.05333L5.52295 1.81069L1.28031 6.05333C0.987415 6.34622 0.512541 6.34622 0.219648 6.05333C-0.0732457 5.76044 -0.0732457 5.28556 0.219648 4.99267L4.99262 0.2197ZM5.52295 16.2183L4.77295 16.2183L4.77295 0.75003L5.52295 0.75003L6.27295 0.75003L6.27295 16.2183L5.52295 16.2183Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
