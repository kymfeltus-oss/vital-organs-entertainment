"use client";

import { createPortal } from "react-dom";
import { TS } from "@/components/todays-service/ServiceUi";

type ConnectionTypeHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ConnectionTypeHelpModal({ open, onClose }: ConnectionTypeHelpModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Which connection should I use?"
        className={`${TS.panel} w-full max-w-md rounded-xl p-5`}
      >
        <h3 className="font-headline text-lg uppercase tracking-[0.08em] text-white">
          Which connection should I use?
        </h3>

        <div className="mt-4 space-y-4 font-body text-sm text-white/75">
          <section>
            <p className="font-semibold text-white">Ethernet</p>
            <p className="mt-1 text-white/60">Best choice for most churches.</p>
            <p className="mt-2 text-xs text-white/55">Allows Parable to:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-white/70">
              <li>✓ Find your mixer automatically</li>
              <li>✓ Read mixer settings</li>
              <li>✓ Monitor microphones</li>
              <li>✓ Test your equipment</li>
              <li>✓ Help troubleshoot problems</li>
            </ul>
          </section>

          <section>
            <p className="font-semibold text-white">USB</p>
            <p className="mt-1 text-xs text-white/65">
              Best if you&apos;re only sending audio into the computer for recording or streaming.
            </p>
            <p className="mt-1 text-xs text-white/55">Some mixer features will not be available.</p>
          </section>

          <section>
            <p className="font-semibold text-white">I&apos;m Not Sure</p>
            <p className="mt-1 text-xs text-white/65">
              Choose this if you don&apos;t know how your mixer is connected. Parable will automatically check both methods.
            </p>
          </section>
        </div>

        <button type="button" onClick={onClose} className={`${TS.btnPrimary} mt-5`}>
          Got It
        </button>
      </div>
    </div>,
    document.body,
  );
}
