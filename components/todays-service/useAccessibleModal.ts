"use client";

import { useEffect, useId, useRef } from "react";

export function useAccessibleModal(open: boolean, onClose: () => void) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        restoreFocusRef.current?.focus();
        wasOpenRef.current = false;
      }
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (justOpened) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      const focusTimer = window.setTimeout(() => {
        const focusable = panelRef.current?.querySelector<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        focusable?.focus();
        // #region agent log
        fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
          body: JSON.stringify({
            sessionId: "675ed0",
            location: "useAccessibleModal.ts:focus",
            message: "modal initial focus",
            data: {
              focusedTag: focusable?.tagName ?? null,
              focusedId: focusable?.id ?? null,
            },
            timestamp: Date.now(),
            hypothesisId: "A",
            runId: "sound-modal",
          }),
        }).catch(() => {});
        // #endregion
      }, 0);

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCloseRef.current();
        }
      };

      document.addEventListener("keydown", onKeyDown);
      return () => {
        window.clearTimeout(focusTimer);
        document.removeEventListener("keydown", onKeyDown);
      };
    }

    return undefined;
  }, [open]);

  return {
    titleId,
    panelRef,
    dialogProps: {
      role: "dialog" as const,
      "aria-modal": true as const,
      "aria-labelledby": titleId,
    },
  };
}
