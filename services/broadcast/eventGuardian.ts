import {
  BROADCAST_BITRATE_DEGRADED_KBPS,
  BROADCAST_PACKET_LOSS_BLOCK_PERCENT,
  BROADCAST_PACKET_LOSS_WARNING_PERCENT,
} from "@/services/broadcast/config";
import type {
  AdapterConnectionMeta,
  AudioTelemetry,
  HardwareSource,
  HealthStatus,
  ProductionState,
  ReadinessReport,
  StreamTelemetry,
} from "@/lib/broadcast/types";

export type EventGuardianRuleId =
  | "recording_off_while_live"
  | "no_program_source"
  | "no_distribution_endpoint"
  | "packet_loss_elevated"
  | "bitrate_degradation"
  | "audio_channel_silent"
  | "audio_clipping"
  | "media_core_unhealthy"
  | "source_registry_empty"
  | "supervisor_override_active";

export type EventGuardianRecommendation = {
  ruleId: EventGuardianRuleId;
  severity: HealthStatus;
  issue: string;
  recommendation: string;
  estimatedImpact: string;
  timestamp: string;
  category: "source" | "audio" | "stream" | "readiness" | "encoder";
  relatedCheckId: string | null;
};

export type EventGuardianInput = {
  sources: HardwareSource[];
  audio: AudioTelemetry;
  stream: StreamTelemetry;
  readiness: ReadinessReport;
  production: ProductionState;
  mediaCore: AdapterConnectionMeta;
};

const RULE_HEADLINE: Record<EventGuardianRuleId, string> = {
  recording_off_while_live: "Recording Off While Live",
  no_program_source: "No Program Source",
  no_distribution_endpoint: "No Distribution Endpoint",
  packet_loss_elevated: "Packet Loss Elevated",
  bitrate_degradation: "Bitrate Degradation",
  audio_channel_silent: "Silent Audio Channel",
  audio_clipping: "Audio Clipping",
  media_core_unhealthy: "Media Core Unhealthy",
  source_registry_empty: "Empty Source Registry",
  supervisor_override_active: "Supervisor Override Active",
};

export function eventGuardianHeadline(ruleId: EventGuardianRuleId): string {
  return RULE_HEADLINE[ruleId];
}

function rec(
  ruleId: EventGuardianRuleId,
  severity: HealthStatus,
  issue: string,
  recommendation: string,
  estimatedImpact: string,
  category: EventGuardianRecommendation["category"],
  relatedCheckId: string | null,
  timestamp: string,
): EventGuardianRecommendation {
  return {
    ruleId,
    severity,
    issue,
    recommendation,
    estimatedImpact,
    timestamp,
    category,
    relatedCheckId,
  };
}

/** Deterministic PARABLE Event Guardian — rule-based operator guidance only. */
export function evaluateEventGuardianRules(input: EventGuardianInput): EventGuardianRecommendation[] {
  const timestamp = new Date().toISOString();
  const rules: EventGuardianRecommendation[] = [];
  const { sources, audio, stream, readiness, production, mediaCore } = input;

  const connectedDestinations = stream.destinations.filter((d) => d.connected);
  const activeDistribution =
    connectedDestinations.length > 0 &&
    (!production.isLive || stream.destinations.some((d) => d.connected && d.live));

  const openFailureCount =
    readiness.hardBlocks.length + readiness.criticalFailures.length + readiness.warnings.length;

  if (production.isLive && !production.isRecording) {
    rules.push(
      rec(
        "recording_off_while_live",
        "orange",
        "Stream is live but ISO recording is not running.",
        "Enable recording on the media core or confirm archive policy with the show caller.",
        "Live show may air without a recoverable ISO — replay and compliance risk.",
        "encoder",
        "recording",
        timestamp,
      ),
    );
  }

  if (!production.programSourceId) {
    rules.push(
      rec(
        "no_program_source",
        "black",
        "No source is routed to the program bus.",
        "Select a preview source and take to program before continuing the show.",
        "Viewers may see black or stale output on air.",
        "source",
        "program_source",
        timestamp,
      ),
    );
  }

  if (!activeDistribution) {
    rules.push(
      rec(
        "no_distribution_endpoint",
        production.isLive ? "black" : "red",
        production.isLive
          ? "No connected distribution endpoint is actively carrying the live feed."
          : "No distribution endpoints are connected.",
        "Verify distribution relay credentials and confirm destination lanes are online.",
        "Audience feeds may fail silently or never reach platforms.",
        "stream",
        "destinations",
        timestamp,
      ),
    );
  }

  if (stream.packetLossPercent >= BROADCAST_PACKET_LOSS_WARNING_PERCENT) {
    const blocked = stream.packetLossPercent >= BROADCAST_PACKET_LOSS_BLOCK_PERCENT;
    rules.push(
      rec(
        "packet_loss_elevated",
        blocked ? "black" : "orange",
        `Packet loss is ${stream.packetLossPercent.toFixed(1)}% — above the ${BROADCAST_PACKET_LOSS_WARNING_PERCENT}% guardian threshold.`,
        "Reduce encoder bitrate, verify uplink stability, or pause go-live until loss clears.",
        "Elevated loss causes dropouts, macro-blocking, and viewer churn.",
        "stream",
        "packet_loss",
        timestamp,
      ),
    );
  }

  const bitrateDegraded =
    !stream.bitrateStable ||
    stream.internetStatus === "degraded" ||
    (stream.bitrateKbps > 0 && stream.bitrateKbps < BROADCAST_BITRATE_DEGRADED_KBPS);

  if (bitrateDegraded && stream.pipelineAvailable) {
    rules.push(
      rec(
        "bitrate_degradation",
        "orange",
        stream.bitrateKbps > 0
          ? `Upload bitrate trend is degraded (${stream.bitrateKbps} kbps).`
          : "Upload bitrate stability is degraded.",
        "Lower output bitrate, reduce concurrent uplink load, or switch to a backup network path.",
        "Degraded uplink increases buffering risk and destination disconnects.",
        "stream",
        "internet_degraded",
        timestamp,
      ),
    );
  }

  const silentChannel = audio.channels.find((ch) => ch.silent || (ch.meterLevel <= 4 && !ch.muted));
  if (audio.masterSilent || silentChannel) {
    const label = silentChannel?.name ?? "Master bus";
    rules.push(
      rec(
        "audio_channel_silent",
        "orange",
        `${label} is silent below the guardian threshold.`,
        "Confirm mic inputs, fader levels, and line routing before the next segment.",
        "Silent audio on air reads as a production failure to the audience.",
        "audio",
        "master_audio_silent",
        timestamp,
      ),
    );
  }

  const clippingChannel = audio.channels.find((ch) => ch.clipping);
  if (audio.masterClipping || clippingChannel) {
    const label = clippingChannel?.name ?? "Master bus";
    rules.push(
      rec(
        "audio_clipping",
        "red",
        `${label} is clipping.`,
        "Reduce gain on the affected channel or engage limiting — do not ride hot into program.",
        "Clipping damages speech intelligibility and listener comfort.",
        "audio",
        "master_clipping",
        timestamp,
      ),
    );
  }

  const mediaCoreDegraded =
    !mediaCore.isAvailable ||
    mediaCore.connectionState !== "connected" ||
    Boolean(mediaCore.lastError);

  if (mediaCoreDegraded) {
    rules.push(
      rec(
        "media_core_unhealthy",
        mediaCore.connectionState === "disconnected" ? "black" : "red",
        mediaCore.lastError
          ? `Media Core is ${mediaCore.connectionState} — ${mediaCore.lastError}`
          : `Media Core is ${mediaCore.connectionState}.`,
        "Restore media core connectivity before switching sources or taking transitions.",
        "Switcher commands and source telemetry may be stale or unavailable.",
        "source",
        null,
        timestamp,
      ),
    );
  }

  if (sources.length === 0) {
    rules.push(
      rec(
        "source_registry_empty",
        "black",
        "The media source registry is empty.",
        "Confirm media core handshake and wait for adapter discovery to populate sources.",
        "No sources are available for preview, program, or recovery.",
        "source",
        "video_source",
        timestamp,
      ),
    );
  }

  if (
    production.supervisorOverride &&
    openFailureCount > 0 &&
    !readiness.canGoLive
  ) {
    rules.push(
      rec(
        "supervisor_override_active",
        "orange",
        "Supervisor override is active while readiness failures remain visible.",
        "Document the override reason, assign an operator to monitor the open issues, and avoid additional bypasses.",
        "Launch may proceed with elevated risk — failures are not cleared automatically.",
        "readiness",
        null,
        timestamp,
      ),
    );
  }

  return rules;
}

export function guardianActionSignature(actions: Array<{ ruleId?: string; severity: HealthStatus }>): string {
  return actions
    .filter((action) => action.ruleId)
    .map((action) => `${action.ruleId}:${action.severity}`)
    .sort()
    .join("|");
}
