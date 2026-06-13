"use client";

import { PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import {
  formatLastSuccessAgo,
  vmixStatusLabel,
} from "@/lib/broadcast/telemetryViews";
import { PRODUCTION_PIPELINE_LABEL, PRODUCTION_PIPELINE_ORDER, type ProductionPipelinePhase } from "@/services/broadcast/pipeline";
import type {
  AdapterConnectionMeta,
  ProductionExecutionFlagsMeta,
  ProductionLogEntry,
  ProductionPipelineTrace,
  VmixAdapterHealthMeta,
} from "@/lib/broadcast/types";
import type { HealthSeverity } from "@/lib/parable/health-types";

type ProductionTelemetryTrayProps = {
  architectureVersion: string;
  rehearsalMode: boolean;
  onRehearsalModeChange: (enabled: boolean) => void;
  vmixAdapter: AdapterConnectionMeta;
  vmixHealth: VmixAdapterHealthMeta;
  executionFlags: ProductionExecutionFlagsMeta;
  pipelineTrace: ProductionPipelineTrace;
  productionLog: ProductionLogEntry[];
  healthSeverity?: HealthSeverity;
  healthAlert?: string | null;
  safeMode?: boolean;
  usingCachedSnapshot?: boolean;
  onSafeModeToggle?: () => void;
};

function vmixTone(status: VmixAdapterHealthMeta["status"]) {
  if (status === "connected") return PARABLE_STATUS.green;
  if (status === "degraded") return PARABLE_STATUS.orange;
  return PARABLE_STATUS.red;
}

function healthTone(severity: HealthSeverity | undefined) {
  switch (severity) {
    case "YELLOW":
      return PARABLE_STATUS.yellow;
    case "ORANGE":
      return PARABLE_STATUS.orange;
    case "RED":
    case "BLACK":
      return PARABLE_STATUS.red;
    default:
      return PARABLE_STATUS.green;
  }
}

function activePipelinePhase(log: ProductionLogEntry | undefined): ProductionPipelinePhase {
  if (!log) return "observe";
  if (log.phase === "command") return "log";
  return log.phase;
}

export default function ProductionTelemetryTray({
  architectureVersion,
  rehearsalMode,
  onRehearsalModeChange,
  vmixAdapter,
  vmixHealth,
  executionFlags,
  pipelineTrace,
  productionLog,
  healthSeverity = "GREEN",
  healthAlert = null,
  safeMode = false,
  usingCachedSnapshot = false,
  onSafeModeToggle,
}: ProductionTelemetryTrayProps) {
  const latestLog = productionLog[0];
  const vmixUi = vmixTone(vmixHealth.status);
  const healthUi = healthTone(healthSeverity);
  const activePhase = activePipelinePhase(latestLog);
  const connected = vmixHealth.status === "connected";

  return (
    <header className="shrink-0 border-b border-white/10 bg-[#111111]" aria-label="Production telemetry tray">
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1">
        <span className="rounded border border-[#1E40AF]/40 bg-[#0B090A] px-1.5 py-px font-headline text-[0.58rem] uppercase tracking-[0.12em] text-white">
          PARABLE Engine v{architectureVersion}
        </span>

        <button
          type="button"
          onClick={() => onRehearsalModeChange(!rehearsalMode)}
          aria-pressed={rehearsalMode}
          className={`rounded border px-1.5 py-px font-ui text-[0.42rem] font-bold uppercase tracking-[0.06em] ${
            rehearsalMode
              ? `${PARABLE_STATUS.yellow.border} ${PARABLE_STATUS.yellow.bg} ${PARABLE_STATUS.yellow.text}`
              : "border-white/12 bg-[#0B090A] text-white/35 opacity-70 hover:border-white/20 hover:opacity-90"
          }`}
        >
          Rehearsal Mode
        </button>

        {onSafeModeToggle ? (
          <button
            type="button"
            onClick={onSafeModeToggle}
            aria-pressed={safeMode}
            className={`rounded border px-1.5 py-px font-ui text-[0.42rem] font-bold uppercase tracking-[0.06em] ${
              safeMode
                ? `${PARABLE_STATUS.red.border} ${PARABLE_STATUS.red.bg} ${PARABLE_STATUS.red.text}`
                : "border-white/12 bg-[#0B090A] text-white/35 opacity-70 hover:border-white/20 hover:opacity-90"
            }`}
          >
            Safe Mode
          </button>
        ) : null}

        <span
          className={`rounded border px-1.5 py-px font-ui text-[0.45rem] font-bold uppercase tracking-[0.06em] ${healthUi.border} ${healthUi.bg} ${healthUi.text}`}
        >
          Health: {healthSeverity}
        </span>

        {usingCachedSnapshot ? (
          <span className={`font-ui text-[0.42rem] font-bold uppercase tracking-[0.06em] ${PARABLE_STATUS.orange.text}`}>
            Cached state
          </span>
        ) : null}

        {healthAlert ? (
          <span
            className={`max-w-[220px] truncate font-ui text-[0.42rem] uppercase ${PARABLE_STATUS.orange.text}`}
            title={healthAlert}
          >
            {healthAlert}
          </span>
        ) : null}

        <span
          className={`rounded border px-1.5 py-px font-ui text-[0.45rem] font-bold uppercase tracking-[0.06em] ${vmixUi.border} ${vmixUi.bg} ${vmixUi.text}`}
        >
          {vmixStatusLabel(vmixHealth.status)}
        </span>

        {connected ? (
          <>
            <span className="font-ui text-[0.45rem] font-bold uppercase tracking-[0.06em] text-white/55">
              Poll: {vmixHealth.pollLatencyMs !== null ? `${vmixHealth.pollLatencyMs}ms` : "—"}
            </span>
            <span className="font-ui text-[0.45rem] font-bold uppercase tracking-[0.06em] text-white/55">
              Sources: {vmixHealth.inputCount}
            </span>
          </>
        ) : (
          <span className={`font-ui text-[0.45rem] font-bold uppercase tracking-[0.06em] ${PARABLE_STATUS.orange.text}`}>
            Last Success: {formatLastSuccessAgo(vmixHealth.lastSuccessfulPollAt)}
          </span>
        )}

        <span
          className={`rounded border px-1.5 py-px font-ui text-[0.45rem] font-bold uppercase tracking-[0.06em] ${
            executionFlags.recording === "active"
              ? `${PARABLE_STATUS.red.border} ${PARABLE_STATUS.red.bg} ${PARABLE_STATUS.red.text}`
              : "border-white/10 bg-[#0B090A] text-white/40"
          }`}
        >
          REC: {executionFlags.recording === "active" ? "ACTIVE" : "OFF"}
        </span>

        <span
          className={`rounded border px-1.5 py-px font-ui text-[0.45rem] font-bold uppercase tracking-[0.06em] ${
            executionFlags.stream === "live"
              ? `${PARABLE_STATUS.red.border} ${PARABLE_STATUS.red.bg} ${PARABLE_STATUS.red.text}`
              : "border-white/10 bg-[#0B090A] text-white/40"
          }`}
        >
          STREAM: {executionFlags.stream === "live" ? "LIVE" : "STANDBY"}
        </span>

        {vmixAdapter.lastError ? (
          <span
            className={`max-w-[180px] truncate font-ui text-[0.42rem] uppercase ${PARABLE_STATUS.orange.text}`}
            title={vmixAdapter.lastError}
          >
            {vmixAdapter.lastError}
          </span>
        ) : null}

        <span className="ml-auto font-ui text-[0.42rem] uppercase tracking-[0.06em] text-white/35">
          Interlock {pipelineTrace.interlockCanGoLive ? "open" : "closed"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/8 px-2 py-0.5">
        <div className="flex min-w-0 shrink items-center gap-0.5">
          {PRODUCTION_PIPELINE_ORDER.map((step, index) => {
            const isActive = step === activePhase;
            return (
              <span key={step} className="flex shrink-0 items-center gap-0.5">
                <span
                  className={`rounded border px-1 py-px font-ui text-[0.38rem] font-bold uppercase tracking-[0.06em] ${
                    isActive
                      ? `${PARABLE_STATUS.green.border} ${PARABLE_STATUS.green.bg} ${PARABLE_STATUS.green.text}`
                      : "border-white/10 bg-[#0B090A] text-white/45"
                  }`}
                >
                  {PRODUCTION_PIPELINE_LABEL[step]}
                </span>
                {index < PRODUCTION_PIPELINE_ORDER.length - 1 ? (
                  <span className="text-[0.35rem] text-white/18">→</span>
                ) : null}
              </span>
            );
          })}
        </div>

        {latestLog ? (
          <p className="min-w-0 flex-1 truncate text-right font-ui text-[0.48rem] text-white/50">
            [{latestLog.phase}] {latestLog.message}
          </p>
        ) : null}
      </div>
    </header>
  );
}
