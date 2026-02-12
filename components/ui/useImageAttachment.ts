import { useCallback, useEffect, useRef, useState } from "react";

export interface ImageAttachmentState {
  file: File | null;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  openFilePicker: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  setFile: (file: File | null) => void;
}

/**
 * Small shared hook for "attach image" UX:
 * - Owns File state
 * - Manages preview URL lifecycle
 * - Exposes helpers for opening the picker and clearing the image
 *
 * Used by both HtmlInput and GenerateDialog so the logic lives in one place.
 */
export function useImageAttachment(): ImageAttachmentState {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep preview URL in sync with the current file
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.files?.[0] ?? null;
      if (!next) {
        setFile(null);
        return;
      }
      if (!next.type.startsWith("image/")) {
        // Keep behavior simple and predictable: ignore non-image files.
        setFile(null);
        return;
      }
      setFile(next);
    },
    []
  );

  const clearImage = useCallback(() => {
    setFile(null);
  }, []);

  return {
    file,
    previewUrl,
    fileInputRef,
    openFilePicker,
    handleFileChange,
    clearImage,
    setFile,
  };
}
