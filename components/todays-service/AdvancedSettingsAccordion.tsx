"use client";

import { useState } from "react";
import { TS } from "@/components/todays-service/ServiceUi";

type AdvancedSettingsAccordionProps = {
  title?: string;
  children: React.ReactNode;
};

export default function AdvancedSettingsAccordion({
  title = "Advanced Settings",
  children,
}: AdvancedSettingsAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-white/10 bg-black/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-white/50"
        aria-expanded={open}
      >
        <span>{open ? "▼" : "▶"} {title}</span>
      </button>
      {open ? <div className="border-t border-white/10 px-3 py-3">{children}</div> : null}
    </div>
  );
}
