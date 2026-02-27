"use client";

import { useEffect, useRef, useState } from "react";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_ALLOWED_PARENT_ORIGIN;
const AUTH_TIMEOUT_MS = 10_000; // 10 seconds to complete handshake
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IFRAME_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_IFRAME_AUTH_ENABLED === "true";

export interface IframeAuthState {
  /**
   * null  = waiting for handshake / in progress
   * true  = iframe + origin-verified + valid sessionKey
   * false = not authorized (direct access, wrong origin, timeout, etc.)
   */
  isAuthorized: boolean | null;
}

/**
 * Client-side iframe auth gate based on a postMessage handshake with the parent dashboard.
 *
 * Security layers:
 * - Iframe detection: blocks direct URL access (no iframe)
 * - Origin verification: only accept messages from the configured dashboard origin
 * - Source verification: only accept messages from window.parent
 * - Message validation: require DASHBOARD_AUTH + valid UUID sessionKey
 */
export function useIframeAuth(): IframeAuthState {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const sessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Explicit bypass: when iframe auth feature-flag is off, always allow.
    if (!IFRAME_AUTH_ENABLED) {
      setIsAuthorized(true);
      return;
    }

    // Development: additional safeguard for local iteration
    if (process.env.NODE_ENV === "development") {
      setIsAuthorized(true);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    // --- Gate 1: must be inside an iframe ---
    if (window.self === window.top) {
      // Not inside an iframe → block immediately
      setIsAuthorized(false);
      return;
    }

    // Fail closed if the allowed origin is not configured
    if (!ALLOWED_ORIGIN) {
      console.error(
        "Iframe auth: NEXT_PUBLIC_ALLOWED_PARENT_ORIGIN is not set; denying access."
      );
      setIsAuthorized(false);
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // --- Gate 2: origin verification ---
      if (event.origin !== ALLOWED_ORIGIN) {
        return;
      }

      // --- Gate 3: ensure the message came from the parent frame ---
      if (event.source !== window.parent) {
        return;
      }

      const data = event.data as
        | { type?: string; sessionKey?: string }
        | undefined;
      const type = data?.type;
      const sessionKey = data?.sessionKey;

      // --- Gate 4: message shape + sessionKey validation ---
      if (type === "DASHBOARD_AUTH" && typeof sessionKey === "string") {
        if (UUID_REGEX.test(sessionKey)) {
          sessionKeyRef.current = sessionKey;
          setIsAuthorized(true);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Signal to parent that the editor is ready for the auth handshake
    try {
      window.parent.postMessage({ type: "EDITOR_READY" }, ALLOWED_ORIGIN);
    } catch (err) {
      console.error("Iframe auth: failed to post EDITOR_READY message", err);
    }

    // Timeout: if we never receive a valid auth message, deny access
    const timeoutId = window.setTimeout(() => {
      setIsAuthorized((current) => (current === null ? false : current));
    }, AUTH_TIMEOUT_MS);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return { isAuthorized };
}
