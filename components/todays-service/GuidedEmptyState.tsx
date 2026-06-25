"use client";

import { TS } from "@/components/todays-service/ServiceUi";

type GuidedEmptyStateProps = {
  title: string;
  intro: string;
  bullets: string[];
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export default function GuidedEmptyState({
  title,
  intro,
  bullets,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: GuidedEmptyStateProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/8 bg-black/40 p-4">
      <div>
        <h3 className="font-body text-[0.95rem] font-semibold text-white">{title}</h3>
        <p className="mt-1 font-body text-[0.82rem] leading-relaxed text-gray-400">{intro}</p>
      </div>
      <ul className="space-y-1 font-body text-[0.8rem] text-white/70">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="text-[#53fc18]" aria-hidden="true">
              •
            </span>
            {bullet}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onAction} className={TS.btnPrimary}>
          {actionLabel}
        </button>
        {secondaryActionLabel && onSecondaryAction ? (
          <button type="button" onClick={onSecondaryAction} className={TS.btnOutline}>
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
