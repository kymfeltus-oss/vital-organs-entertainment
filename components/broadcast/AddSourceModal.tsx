"use client";

import { useEffect, useState } from "react";
import { PARABLE_SHELL } from "@/lib/broadcast/parable-tokens";
import type { SourceConnectionType } from "@/lib/broadcast/types";

type AddSourceModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (payload: { name: string; connectionType: SourceConnectionType }) => void;
};

const SOURCE_TYPES: { value: SourceConnectionType; label: string }[] = [
  { value: "hdmi", label: "HDMI" },
  { value: "ndi", label: "NDI" },
  { value: "srt", label: "SRT" },
  { value: "rtmp", label: "RTMP" },
  { value: "webcam", label: "Webcam" },
];

export default function AddSourceModal({ open, onClose, onAdd }: AddSourceModalProps) {
  const [name, setName] = useState("");
  const [connectionType, setConnectionType] = useState<SourceConnectionType>("hdmi");

  useEffect(() => {
    if (!open) {
      setName("");
      setConnectionType("hdmi");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-source-title"
        className={`w-full max-w-lg rounded-2xl border border-white/10 ${PARABLE_SHELL.panel} p-6 shadow-2xl`}
      >
        <h2
          id="add-source-title"
          className="font-headline text-2xl uppercase tracking-[0.18em] text-white"
        >
          Add Source
        </h2>
        <p className={`mt-2 font-body text-sm ${PARABLE_SHELL.muted}`}>
          Sources register through BroadcastSourceService when production adapters connect.
          In DEV_MODE, discovery is simulated by the service layer — not the UI.
        </p>

        <label className="mt-6 block">
          <span className={`font-ui text-xs font-bold uppercase tracking-[0.14em] ${PARABLE_SHELL.muted}`}>
            Source name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Keys Wide"
            className={`mt-2 w-full rounded-xl border border-white/10 bg-[#0B090A] px-4 py-3 font-body text-base text-white placeholder:text-white/35 focus:border-[#1E40AF]/50 focus:outline-none`}
          />
        </label>

        <fieldset className="mt-5">
          <legend className={`font-ui text-xs font-bold uppercase tracking-[0.14em] ${PARABLE_SHELL.muted}`}>
            Connection type
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SOURCE_TYPES.map((type) => (
              <label
                key={type.value}
                className={`cursor-pointer rounded-xl border px-3 py-3 text-center font-ui text-sm font-bold uppercase tracking-[0.1em] transition ${
                  connectionType === type.value
                    ? "border-[#1E40AF]/50 bg-[#1E40AF]/15 text-white"
                    : `border-white/10 ${PARABLE_SHELL.muted} hover:border-white/20`
                }`}
              >
                <input
                  type="radio"
                  name="source-type"
                  value={type.value}
                  checked={connectionType === type.value}
                  onChange={() => setConnectionType(type.value)}
                  className="sr-only"
                />
                {type.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-8 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`touch-target rounded-xl border border-white/15 px-5 py-2.5 font-ui text-sm font-bold uppercase tracking-[0.1em] ${PARABLE_SHELL.muted} transition hover:text-white`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => {
              onAdd({ name: name.trim(), connectionType });
              onClose();
            }}
            className={`touch-target rounded-xl border px-5 py-2.5 font-ui text-sm font-bold uppercase tracking-[0.1em] text-white transition disabled:opacity-50 ${PARABLE_SHELL.btnSecondary}`}
          >
            Request registration
          </button>
        </div>
      </div>
    </div>
  );
}
