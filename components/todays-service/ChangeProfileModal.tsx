"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TS } from "@/components/todays-service/ServiceUi";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";
import {
  BROADCAST_PROFILE_OPTIONS,
  resolveBroadcastProfileSelection,
} from "@/lib/todays-service/broadcast-profiles";
import { BROADCAST_PROFILE_FEATURES } from "@/lib/todays-service/coaching";
import type { ServiceRecord } from "@/lib/todays-service/types";

type ChangeProfileModalProps = {
  open: boolean;
  service: ServiceRecord;
  saving?: boolean;
  saveError?: string | null;
  onClose: () => void;
  onSave: (broadcastProfile: string) => Promise<{ success: boolean; error?: string }>;
};

export default function ChangeProfileModal({
  open,
  service,
  saving = false,
  saveError = null,
  onClose,
  onSave,
}: ChangeProfileModalProps) {
  const savedProfile = resolveBroadcastProfileSelection(service.broadcastProfile);
  const [selectedProfile, setSelectedProfile] = useState(savedProfile);
  const [validationError, setValidationError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);
  const { titleId, panelRef, dialogProps } = useAccessibleModal(open, onClose);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setSelectedProfile(resolveBroadcastProfileSelection(service.broadcastProfile));
      setValidationError(null);
    }
    wasOpenRef.current = open;
  }, [open, service.broadcastProfile]);

  if (!open) return null;

  const isChangingProfile = selectedProfile !== savedProfile;

  const handleSave = async () => {
    if (!selectedProfile.trim()) {
      setValidationError("Choose a broadcast profile.");
      return;
    }

    const result = await onSave(selectedProfile);
    if (result.success) {
      onClose();
    }
  };

  const displayError = validationError ?? saveError;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div
        ref={panelRef}
        {...dialogProps}
        className={`${TS.panel} relative flex max-h-[min(90dvh,720px)] w-full max-w-xl flex-col rounded-xl p-5`}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id={titleId} className="pr-8 font-headline text-lg uppercase tracking-[0.1em] text-white">
          Change Broadcast Profile
        </h2>
        <p className="mt-1 font-body text-sm text-gray-400">
          Choose the setup style that best fits today&apos;s service.
        </p>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <fieldset className="space-y-2" disabled={saving}>
            <legend className="sr-only">Broadcast profile options</legend>
            {BROADCAST_PROFILE_OPTIONS.map((option) => {
              const selected = selectedProfile === option.name;
              const isCurrentSaved = option.name === savedProfile;
              return (
                <label
                  key={option.name}
                  className={`block cursor-pointer rounded-lg border px-4 py-3 transition ${
                    selected
                      ? "border-[#00f2ff]/60 bg-[#00f2ff]/10 shadow-[0_0_20px_rgba(0,242,255,0.12)]"
                      : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="broadcastProfile"
                      value={option.name}
                      checked={selected}
                      onChange={() => {
                        setSelectedProfile(option.name);
                        setValidationError(null);
                      }}
                      className="mt-1 accent-[#00f2ff]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="block font-ui text-sm font-semibold uppercase tracking-[0.06em] text-white">
                          {option.name}
                        </span>
                        {isCurrentSaved ? (
                          <span className="rounded-full border border-[#53fc18]/40 bg-[#53fc18]/10 px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] text-[#53fc18]">
                            ⭐ Current Profile
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block font-body text-sm leading-relaxed text-white/60">
                        {option.description}
                      </span>
                    </span>
                  </div>
                </label>
              );
            })}
          </fieldset>
        </div>

        {isChangingProfile ? (
          <div className="mt-4 rounded-lg border border-[#00f2ff]/30 bg-[#00f2ff]/5 p-4">
            <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[#00f2ff]">
              Changing to:
            </p>
            <p className="mt-1 font-headline text-lg uppercase tracking-[0.06em] text-white">
              ⭐ {selectedProfile}
            </p>
            <p className="mt-3 font-ui text-[0.52rem] font-bold uppercase tracking-[0.08em] text-white/55">
              This will automatically optimize:
            </p>
            <ul className="mt-2 space-y-1">
              {BROADCAST_PROFILE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 font-body text-sm text-white/80">
                  <span className="text-[#53fc18]" aria-hidden="true">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-3 font-body text-sm text-white/55">
              This will not delete any of your equipment.
            </p>
          </div>
        ) : null}

        {displayError ? (
          <p className="mt-3 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 font-body text-sm text-red-300">
            {displayError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button type="button" disabled={saving} onClick={() => void handleSave()} className={TS.btnPrimary}>
            {saving ? "Saving…" : "Save Profile"}
          </button>
          <button type="button" disabled={saving} onClick={onClose} className={TS.btnOutline}>
            Cancel
          </button>
          <button type="button" disabled={saving} onClick={onClose} className={TS.btnOutline}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
