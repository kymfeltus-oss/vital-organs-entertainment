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
