"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEditorState } from "../../stores/useEditorState";
import { validateHtmlContent } from "../../utils/htmlValidation";

interface HtmlEditorWithValidationProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  sectionId?: string;
}

export const HtmlEditorWithValidation: React.FC<
  HtmlEditorWithValidationProps
> = ({ value, onChange, disabled = false, sectionId }) => {
  const { setHtmlValidationErrors, clearHtmlValidationErrors } =
    useEditorState();
  const valueRef = useRef(value);

  // Keep latest value in ref
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const validate = useCallback(async () => {
    const currentValue = valueRef.current || "";

    if (!currentValue.trim()) {
      if (sectionId) {
        setHtmlValidationErrors(sectionId, []);
      }
      return;
    }

    const errors = await validateHtmlContent(currentValue);

    if (sectionId) {
      setHtmlValidationErrors(sectionId, errors);
    }
  }, [sectionId, setHtmlValidationErrors]);

  const handleMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      // Run validation whenever the editor loses focus
      editorInstance.onDidBlurEditorText(() => {
        validate();
      });
    },
    [validate]
  );

  return (
    <Editor
      height="650px"
      language="html"
      value={value}
      onChange={(val) => {
        // Clear previous errors as soon as user starts editing
        if (sectionId) {
          clearHtmlValidationErrors(sectionId);
        }
        onChange(val || "");
      }}
      onMount={handleMount}
      theme="vs"
      options={{
        minimap: { enabled: false },
        wordWrap: "on",
        lineNumbers: "on",
        readOnly: disabled,
      }}
    />
  );
};
