"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { SCHEDULE_TIMEZONE_OPTIONS } from "@/lib/live/schedule-timezone";
import {
  formatStepAnswerForChat,
  getWizardPhaseIndex,
  maskStreamKey,
  PRESHOW_WIZARD_PHASE_COUNT,
  PRESHOW_WIZARD_STEPS,
} from "@/lib/production/preshow-setup";
import type { UsePreShowSetupReturn } from "@/hooks/production/usePreShowSetup";
import { cn } from "@/lib/utils";

type PreShowChatWizardProps = {
  setup: UsePreShowSetupReturn;
};

const INPUT_CLASS =
  "w-full rounded-xl border border-brand-border bg-brand-black/80 px-3 py-2.5 font-body text-sm text-white outline-none transition focus:border-brand-blue/50";

function stepValue(
  setupState: UsePreShowSetupReturn["setupState"],
  stepId: UsePreShowSetupReturn["currentStep"]["id"],
): string | boolean | string[] {
  if (stepId === "finalConfirmation") return setupState.finalConfirmed;
  return setupState[stepId];
}

function formatChatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function SystemBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-purple/40 bg-brand-purple/20 text-brand-purple"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-brand-border bg-brand-panel px-3 py-2.5">
        <p className="font-body text-sm leading-relaxed text-brand-muted">{children}</p>
      </div>
    </div>
  );
}

function UserBubble({
  children,
  timestamp,
  masked,
  onToggleMask,
}: {
  children: ReactNode;
  timestamp: string;
  masked?: boolean;
  onToggleMask?: () => void;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex max-w-[92%] items-center gap-2 rounded-2xl rounded-tr-md border border-brand-blue/30 bg-brand-blue/15 px-3 py-2.5">
        <p className="break-all font-body text-sm text-white">{children}</p>
        {onToggleMask ? (
          <button
            type="button"
            onClick={onToggleMask}
            aria-label={masked ? "Show stream key" : "Hide stream key"}
            className="shrink-0 text-brand-blue"
          >
            {masked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      <span className="font-body text-[0.65rem] text-brand-muted">{timestamp}</span>
    </div>
  );
}

export default function PreShowChatWizard({ setup }: PreShowChatWizardProps) {
  const {
    currentStep,
    stepIndex,
    setupState,
    stepError,
    updateField,
    goNext,
    goPrevious,
    saveCurrentStep,
    saveMessage,
    saveEndpointStatus,
    isSavingSchedule,
  } = setup;

  const [showStreamKey, setShowStreamKey] = useState(false);
  const [historyMask, setHistoryMask] = useState<Record<number, boolean>>({});
  const isStreamKeyStep = currentStep.id === "streamKey";
  const isSaving = saveEndpointStatus === "saving" || isSavingSchedule;
  const phaseIndex = getWizardPhaseIndex(stepIndex);
  const chatTimestamp = useMemo(() => formatChatTime(new Date()), [stepIndex]);

  const completedSteps = PRESHOW_WIZARD_STEPS.slice(0, stepIndex);

  function renderInput() {
    const value = stepValue(setupState, currentStep.id);

    switch (currentStep.kind) {
      case "date":
        return (
          <input
            type="date"
            value={String(value ?? "")}
            onChange={(event) => updateField(currentStep.id, event.target.value)}
            className={INPUT_CLASS}
          />
        );
      case "time":
        return (
          <input
            type="time"
            value={String(value ?? "")}
            onChange={(event) => updateField(currentStep.id, event.target.value)}
            className={INPUT_CLASS}
          />
        );
      case "timezone":
        return (
          <select
            value={setupState.timezone}
            onChange={(event) =>
              updateField("timezone", event.target.value as typeof setupState.timezone)
            }
            className={INPUT_CLASS}
          >
            {SCHEDULE_TIMEZONE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "destinations": {
        const draft = setupState.outputDestinations.join(", ");
        return (
          <input
            type="text"
            value={draft}
            onChange={(event) => {
              const next = event.target.value
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean);
              updateField("outputDestinations", next);
            }}
            placeholder="YouTube, Restream, Website embed"
            className={INPUT_CLASS}
          />
        );
      }
      case "toggle":
        return (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand-border bg-brand-black/50 px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => updateField(currentStep.id, event.target.checked)}
              className="h-5 w-5 accent-brand-blue"
            />
            <span className="font-ui text-sm uppercase tracking-[0.08em] text-white">
              {Boolean(value) ? "Enabled" : "Disabled"}
            </span>
          </label>
        );
      case "confirm":
        return (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-border bg-brand-black/50 px-4 py-3">
            <input
              type="checkbox"
              checked={setupState.finalConfirmed}
              onChange={(event) => updateField("finalConfirmation", event.target.checked)}
              className="mt-0.5 h-5 w-5 accent-brand-blue"
            />
            <span className="font-body text-sm text-brand-muted">
              I confirm all production settings have been reviewed before showtime.
            </span>
          </label>
        );
      default:
        return (
          <div className="relative">
            <input
              type={isStreamKeyStep && !showStreamKey ? "password" : "text"}
              value={String(value ?? "")}
              onChange={(event) => updateField(currentStep.id, event.target.value)}
              autoComplete={isStreamKeyStep ? "off" : undefined}
              className={cn(INPUT_CLASS, isStreamKeyStep && "pr-10")}
              placeholder={isStreamKeyStep ? "Enter stream key" : undefined}
            />
            {isStreamKeyStep ? (
              <button
                type="button"
                onClick={() => setShowStreamKey((current) => !current)}
                aria-label={showStreamKey ? "Hide stream key" : "Show stream key"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-blue"
              >
                {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            ) : null}
          </div>
        );
    }
  }

  const currentAnswerPreview = formatStepAnswerForChat(currentStep.id, setupState, {
    revealStreamKey: showStreamKey,
  });

  return (
    <section className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-panel/40">
      <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white">
          Setup Assistant
        </h2>
        <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-brand-muted">
          Step {phaseIndex} of {PRESHOW_WIZARD_PHASE_COUNT}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {completedSteps.map((step, index) => {
          const answer = formatStepAnswerForChat(step.id, setupState, {
            revealStreamKey: historyMask[index] ?? false,
          });
          const isKeyStep = step.id === "streamKey";
          const hasAnswer = answer !== "—";

          return (
            <div key={step.id} className="space-y-3">
              <SystemBubble>{step.prompt}</SystemBubble>
              {hasAnswer ? (
                <UserBubble
                  timestamp={chatTimestamp}
                  masked={isKeyStep && !(historyMask[index] ?? false)}
                  onToggleMask={
                    isKeyStep
                      ? () =>
                          setHistoryMask((current) => ({
                            ...current,
                            [index]: !current[index],
                          }))
                      : undefined
                  }
                >
                  {isKeyStep && !(historyMask[index] ?? false)
                    ? maskStreamKey(setupState.streamKey)
                    : answer}
                </UserBubble>
              ) : null}
            </div>
          );
        })}

        <div className="space-y-3">
          <SystemBubble>{currentStep.prompt}</SystemBubble>
          {currentAnswerPreview !== "—" && currentStep.kind !== "confirm" ? (
            <UserBubble timestamp={chatTimestamp}>
              {isStreamKeyStep && !showStreamKey
                ? maskStreamKey(setupState.streamKey)
                : currentAnswerPreview}
            </UserBubble>
          ) : null}
        </div>

        <div className="mt-1">{renderInput()}</div>

        {stepError ? (
          <p className="rounded-lg border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink">
            {stepError}
          </p>
        ) : null}

        {saveMessage ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              saveEndpointStatus === "connected"
                ? "border-brand-blue/40 bg-brand-blue/10 text-brand-blue"
                : saveEndpointStatus === "partial"
                  ? "border-brand-purple/40 bg-brand-purple/10 text-brand-purple"
                  : "border-brand-border bg-brand-black/40 text-brand-muted",
            )}
          >
            {saveMessage}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-t border-brand-border px-4 py-3">
        <button
          type="button"
          onClick={goPrevious}
          disabled={stepIndex === 0 || isSaving}
          className="touch-target flex-1 rounded-lg border border-brand-border bg-brand-black/50 px-3 py-2.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-brand-muted transition hover:text-white disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => void saveCurrentStep()}
          disabled={isSaving}
          className="touch-target flex-1 rounded-lg border border-brand-border bg-brand-black/50 px-3 py-2.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-brand-muted transition hover:text-white disabled:opacity-40"
        >
          Save Step
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={isSaving}
          className="touch-target parable-btn-cyan flex-[1.2] rounded-lg px-3 py-2.5 font-ui text-[0.58rem] disabled:opacity-40"
        >
          Next &gt;
        </button>
      </div>
    </section>
  );
}
