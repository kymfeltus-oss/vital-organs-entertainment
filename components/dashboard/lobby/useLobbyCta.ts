"use client";

import { useMemo } from "react";
import type { EventCountdownConfig, EventCountdownPhase } from "@/lib/live/countdown-config";
import type { LiveAccessPhase } from "@/lib/useLiveAccessVerification";

type LobbyCta = {
  label: string;
  href?: string;
  disabled: boolean;
};

function buildLobbyCta(
  config: EventCountdownConfig,
  eventPhase: EventCountdownPhase,
  phase: LiveAccessPhase,
  streamIsLive: boolean,
): LobbyCta {
  if (eventPhase === "ended") {
    return { label: "EXPERIENCE ENDED", href: undefined, disabled: true };
  }
  if (phase === "checking" || phase === "activating_pass") {
    return { label: "ACTIVATING YOUR PASS", href: undefined, disabled: true };
  }
  if (phase === "locked") {
    return { label: "GET YOUR PASS", href: "/dashboard/merch", disabled: false };
  }

  if (eventPhase === "waiting" || !streamIsLive) {
    return {
      label: config.cta_label_waiting,
      href: "/experience/live",
      disabled: false,
    };
  }

  if (phase === "guest_hub") {
    return {
      label: "JOIN LIVE EXPERIENCE",
      href: "/experience/live",
      disabled: false,
    };
  }

  return {
    label: config.cta_label_live,
    href: "/experience/live",
    disabled: false,
  };
}

export function useLobbyCta(
  config: EventCountdownConfig,
  eventPhase: EventCountdownPhase,
  phase: LiveAccessPhase,
  streamIsLive: boolean,
): LobbyCta {
  return useMemo(
    () => buildLobbyCta(config, eventPhase, phase, streamIsLive),
    [config, eventPhase, phase, streamIsLive],
  );
}
