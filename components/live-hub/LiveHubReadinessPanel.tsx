"use client";

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Circle,
  CloudUpload,
  Globe,
  HardDrive,
  Mic,
  Monitor,
  Presentation,
  Radio,
  Server,
  XCircle,
} from "lucide-react";
import type { ReadinessCheck, ReadinessCheckId, CheckStatus } from "@/lib/live-hub/types";

const CHECK_ICONS: Record<ReadinessCheckId, typeof Globe> = {
  internet: Globe,
  upload_speed: CloudUpload,
  stream_destination: Radio,
  encoder_vmix: Monitor,
  recording: HardDrive,
  audio_input: Mic,
  camera_feeds: Camera,
  presentation: Presentation,
  backup_systems: Server,
};

const DISPLAY_LABELS: Partial<Record<ReadinessCheckId, string>> = {
  encoder_vmix: "Encoder & Software",
};

function statusIndicator(status: CheckStatus) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="h-4 w-4 text-[#93c5fd]" aria-hidden="true" />;
    case "warn":
      return <AlertTriangle className="h-4 w-4 text-[#f5c2e0]" aria-hidden="true" />;
    case "fail":
      return <XCircle className="h-4 w-4 text-[#B0267A]" aria-hidden="true" />;
    default:
      return <Circle className="h-4 w-4 text-zinc-600" aria-hidden="true" />;
  }
}

function statusText(status: CheckStatus): string {
  switch (status) {
    case "pass":
      return "Ready";
    case "warn":
      return "Warning";
    case "fail":
      return "Blocked";
    case "pending":
      return "Pending";
    default:
      return "Unknown";
  }
}

type LiveHubReadinessPanelProps = {
  checks: ReadinessCheck[];
};

export default function LiveHubReadinessPanel({ checks }: LiveHubReadinessPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111111]/95 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
          System Readiness
        </h3>
        <span className="text-[0.5rem] uppercase tracking-[0.14em] text-zinc-600">
          Fail-closed
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {checks.map((check) => {
          const Icon = CHECK_ICONS[check.id];
          const label = DISPLAY_LABELS[check.id] ?? check.label;
          return (
            <div
              key={check.id}
              className="flex items-start gap-3 rounded-xl border border-white/8 bg-[#0B090A]/80 px-3 py-2.5"
            >
              <div className="mt-0.5 text-[#1E40AF]">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-zinc-200">
                    {label}
                  </p>
                  {statusIndicator(check.status)}
                </div>
                <p className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {statusText(check.status)}
                </p>
                <p className="mt-1 text-xs leading-snug text-zinc-500">{check.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
