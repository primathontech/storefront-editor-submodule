"use client";

import React, { useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRightSidebarWidth } from "../../context/RightSidebarWidthContext";
import { useEditorState } from "../../stores/useEditorState";
import { htmlChatService } from "../../services/chat/chat-service";
import { ChatMessage, ChatRole, Conversation } from "../../models/chat-types";

// Lazy load the entire editor component with all heavy dependencies in one chunk
const HtmlEditorWithValidation = dynamic(
  () =>
    import("./HtmlEditor").then((mod) => ({
      default: mod.HtmlEditorWithValidation,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          height: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading editor...
      </div>
    ),
  }
);

export interface HtmlInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  sectionId?: string;
}

export const HtmlInput: React.FC<HtmlInputProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  placeholder = "Enter HTML code...",
  sectionId,
}) => {
  const [isCodeView, setIsCodeView] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatImageFile, setChatImageFile] = useState<File | null>(null);
  const { setWidth } = useRightSidebarWidth();
  const { htmlValidationErrors } = useEditorState();

  // Get errors for this section from store (single source of truth)
  const validationErrors = sectionId
    ? htmlValidationErrors[sectionId] || []
    : [];

  // When this input is mounted, widen the right sidebar slightly for better UX.
  useEffect(() => {
    setWidth(600);
    return () => {
      setWidth(400);
    };
  }, [setWidth]);

  // Load existing conversation for this section (if any)
  useEffect(() => {
    if (!sectionId) return;
    const conversationId = `custom-html:${sectionId}`;
    const existing = htmlChatService.getConversation(conversationId);
    setConversation(existing);
  }, [sectionId]);

  const handleSendMessage = useCallback(async () => {
    if (!sectionId || !chatInput.trim() || isSending || disabled) return;

    const conversationId = `custom-html:${sectionId}`;

    setIsSending(true);
    try {
      const { conversation: updatedConversation, html } =
        await htmlChatService.sendMessage({
          conversationId,
          userInput: chatInput.trim(),
          currentHtml: value,
          imageFile: chatImageFile,
        });

      setConversation(updatedConversation);
      setChatInput("");
      setChatImageFile(null);

      if (html) {
        onChange(html);
      }
    } catch (error) {
      console.error("AI chat error:", error);
    } finally {
      setIsSending(false);
    }
  }, [
    sectionId,
    chatInput,
    isSending,
    disabled,
    value,
    chatImageFile,
    onChange,
  ]);

  return (
    <div>
      {/* Body: either Chat view or Code view */}
      <div
        style={{
          height: "500px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isCodeView ? (
          <>
            {/* Code view header */}
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
              }}
            >
              <button
                type="button"
                onClick={() => setIsCodeView(false)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "12px",
                  cursor: "pointer",
                  color: "#2563eb",
                  padding: "4px 0",
                }}
              >
                &lt; Back to Chat
              </button>
            </div>

            {/* Code editor */}
            <div style={{ flex: 1 }}>
              <HtmlEditorWithValidation
                value={value}
                onChange={onChange}
                disabled={disabled}
                sectionId={sectionId}
              />
            </div>

            {/* Validation errors (only in code view) */}
            {validationErrors.length > 0 && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  fontSize: "12px",
                  borderTop: "1px solid #fecaca",
                }}
              >
                <strong>Errors:</strong>
                <ul style={{ marginTop: "4px", paddingLeft: "18px" }}>
                  {validationErrors.map((e, idx) => (
                    <li key={idx}>
                      Line {e.line}, Column {e.column}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Chat area */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  maxHeight: "100%",
                  overflowY: "auto",
                  padding: "4px 0",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                }}
              >
                {conversation && conversation.messages.length > 0 ? (
                  conversation.messages.map((msg: ChatMessage) => (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          msg.role === ChatRole.USER
                            ? "flex-end"
                            : "flex-start",
                        padding: "4px 8px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "8px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          lineHeight: 1.4,
                          backgroundColor:
                            msg.role === ChatRole.USER ? "#dbeafe" : "#f3f4f6",
                          color: "#111827",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <span
                    style={{
                      padding: "8px 10px",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    Ask AI to help you write or improve this HTML, CSS, and JS.
                  </span>
                )}
              </div>

              {/* Chat input */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-end",
                }}
              >
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask to AI..."
                  disabled={isSending || disabled}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "12px",
                    minHeight: "40px",
                    maxHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isSending || disabled}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "999px",
                    border: "none",
                    backgroundColor:
                      !chatInput.trim() || isSending || disabled
                        ? "#9ca3af"
                        : "#1d4ed8",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor:
                      !chatInput.trim() || isSending || disabled
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "16px",
                  }}
                >
                  ↑
                </button>
              </div>

              {/* Footer: attach image + Code View button */}
              <div
                style={{
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  fontSize: "11px",
                  color: "#4b5563",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <label
                    style={{
                      cursor: isSending || disabled ? "not-allowed" : "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Attach image
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={isSending || disabled}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setChatImageFile(null);
                          return;
                        }
                        if (!file.type.startsWith("image/")) {
                          console.error("Selected file is not an image");
                          setChatImageFile(null);
                          return;
                        }
                        setChatImageFile(file);
                      }}
                    />
                  </label>
                  {chatImageFile && (
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        maxWidth: "200px",
                      }}
                      title={chatImageFile.name}
                    >
                      {chatImageFile.name}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCodeView(true)}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid #d1d5db",
                    padding: "4px 10px",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  &lt;/&gt; Code View
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
