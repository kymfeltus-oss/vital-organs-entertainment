"use client";

import type { PreShowSummaryCard, SummaryCardStatus } from "@/lib/production/preshow-setup";
import { PRESHOW_CARD_STEP_INDEX } from "@/lib/production/preshow-setup";
import type { UsePreShowSetupReturn } from "@/hooks/production/usePreShowSetup";
import { cn } from "@/lib/utils";

type PreShowSettingsSummaryProps = {
  setup: UsePreShowSetupReturn;
};

function statusLabel(status: SummaryCardStatus): string {
  switch (status) {
    case "configured":
      return "Configured";
    case "missing":
      return "Missing";
    case "needs_review":
      return "Needs Review";
  }
}

function statusClass(status: SummaryCardStatus): string {
  switch (status) {
    case "configured":
      return "text-emerald-400";
    case "missing":
      return "text-brand-pink";
    case "needs_review":
      return "text-brand-pink";
  }
}

function cardBorderClass(status: SummaryCardStatus, cardId: string): string {
  if (cardId === "safety" && status !== "configured") {
    return "border-brand-pink/50 bg-brand-pink/5";
  }
  if (status === "configured") {
    return "border-brand-border bg-brand-panel/30";
  }
  return "border-brand-border bg-brand-black/30";
}

function SummaryCard({
  card,
  onEdit,
}: {
  card: PreShowSummaryCard;
  onEdit: () => void;
}) {
  return (
    <article
      className={cn(
        "flex min-h-[118px] flex-col rounded-xl border p-4 transition",
        cardBorderClass(card.status, card.id),
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
          {card.label}
        </h3>
        <span
          className={cn(
            "font-ui text-[0.52rem] font-bold uppercase tracking-[0.08em]",
            statusClass(card.status),
          )}
        >
          {statusLabel(card.status)}
        </span>
      </div>
      <p className="mb-4 flex-1 font-body text-xs leading-relaxed text-brand-muted">
        {card.detail}
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="self-start rounded-md border border-brand-border px-3 py-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-brand-muted transition hover:border-brand-blue/30 hover:text-brand-blue"
      >
        Edit
      </button>
    </article>
  );
}

export default function PreShowSettingsSummary({ setup }: PreShowSettingsSummaryProps) {
  const { summaryCards, saveEndpointStatus, goToStep } = setup;

  return (
    <section className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-panel/20">
      <div className="border-b border-brand-border px-4 py-3">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white">
          Saved Settings Summary
        </h2>
        {saveEndpointStatus === "partial" || saveEndpointStatus === "disconnected" ? (
          <p className="mt-1 font-body text-xs text-brand-purple">
            Save endpoint not connected for extended production fields.
          </p>
        ) : null}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.id}
            card={card}
            onEdit={() => {
              const stepIndex = PRESHOW_CARD_STEP_INDEX[card.id];
              if (typeof stepIndex === "number") goToStep(stepIndex);
            }}
          />
        ))}
      </div>
    </section>
  );
}
