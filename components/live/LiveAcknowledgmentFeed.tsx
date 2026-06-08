"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { ACKNOWLEDGMENT_TOAST_DURATION_MS } from "@/lib/live/acknowledgments";
import type { LiveAcknowledgment } from "@/lib/live/acknowledgments";

type LiveAcknowledgmentFeedProps = {
  toasts: LiveAcknowledgment[];
  onDismiss: (id: string) => void;
};

export default function LiveAcknowledgmentFeed({
  toasts,
  onDismiss,
}: LiveAcknowledgmentFeedProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <AcknowledgmentToast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function AcknowledgmentToast({
  toast,
  onDismiss,
}: {
  toast: LiveAcknowledgment;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, ACKNOWLEDGMENT_TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onDismiss, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="pointer-events-auto overflow-hidden rounded-xl border border-[#1E40AF]/40 bg-[#0B090A]/92 px-4 py-3 shadow-[0_0_24px_rgba(30,64,175,0.25)] backdrop-blur-md"
    >
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#1E40AF]">
        Harvest Acknowledgment
      </p>
      <p className="mt-1 text-sm text-zinc-100">{toast.message}</p>
    </motion.div>
  );
}
