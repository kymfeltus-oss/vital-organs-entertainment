"use client";

import { useEffect, useMemo } from "react";

import { fetchRoutingConfig } from "@/app/enterprise/coleman/lib/api-client";
import { useStageAudioRouting } from "@/app/enterprise/coleman/lib/hooks/useStageAudioRouting";
import { getRoutingUserId } from "@/app/enterprise/coleman/lib/routing-user-id";

type StageOutputLauncherProps = {
  onOpenSettings: () => void;
};

export default function StageOutputLauncher({ onOpenSettings }: StageOutputLauncherProps) {
  const userId = useMemo(() => getRoutingUserId(), []);
  const {
    externalLineConnected,
    routingProfile,
    routingBusy,
    routingError,
    headphonesConnected,
    sinkSelectionSupported,
    activeOutputLabel,
    clearRoutingError,
    applyPersistedRoutingConfig,
  } = useStageAudioRouting();

  useEffect(() => {
    void fetchRoutingConfig(userId)
      .then((config) => applyPersistedRoutingConfig(config))
      .catch(() => {
        /* Home chip falls back to live hardware state */
      });
  }, [applyPersistedRoutingConfig, userId]);

  const speakerHint =
    !sinkSelectionSupported && routingProfile === "speaker"
      ? "Browser uses system output — unplug in-ears to hear the speaker."
      : null;

  return (
    <div className="coleman-stage-audio-chrome mb-3 space-y-2.5">
      <div className="flex justify-center">
        <span
          className={`coleman-stage-input-pill ${
            externalLineConnected
              ? "coleman-stage-input-pill--direct"
              : "coleman-stage-input-pill--mic"
          }`}
        >
          {externalLineConnected
            ? "🔒 DIRECT AUDIO LINE CONNECTED"
            : "🎤 INT. MIC GATE ACTIVE"}
        </span>
      </div>

      <div
        className="coleman-stage-routing-toggle"
        role="group"
        aria-label="Stage output routing"
        aria-busy={routingBusy}
      >
        <button
          type="button"
          className={`coleman-stage-routing-chip ${
            routingProfile === "headphones" ? "is-active" : ""
          }`}
          aria-pressed={routingProfile === "headphones"}
          disabled={routingBusy}
          onClick={onOpenSettings}
        >
          🎧 In-Ears
        </button>
        <button
          type="button"
          className={`coleman-stage-routing-chip ${
            routingProfile === "speaker" ? "is-active" : ""
          }`}
          aria-pressed={routingProfile === "speaker"}
          disabled={routingBusy}
          onClick={onOpenSettings}
        >
          🔊 Phone Speaker
        </button>
      </div>

      <p className="text-center text-[8px] font-normal tracking-[0.12em] text-[var(--cp-muted)]">
        {routingBusy
          ? "Switching output…"
          : `Output · ${activeOutputLabel}${headphonesConnected ? " · IEM detected" : ""} · Tap to configure`}
      </p>

      {speakerHint ? (
        <p className="text-center text-[8px] leading-relaxed tracking-[0.06em] text-[var(--cp-taupe)]">
          {speakerHint}
        </p>
      ) : null}

      {routingError ? (
        <div
          className="coleman-stage-routing-error flex items-start justify-between gap-2 rounded-xl px-2.5 py-2 text-[9px] text-[var(--cp-espresso)]"
          role="alert"
        >
          <span>{routingError}</span>
          <button
            type="button"
            className="shrink-0 text-[8px] tracking-[0.1em] text-[var(--cp-muted)]"
            onClick={clearRoutingError}
          >
            DISMISS
          </button>
        </div>
      ) : null}
    </div>
  );
}
