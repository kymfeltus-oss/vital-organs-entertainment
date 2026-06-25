"use client";

import { memo, useMemo } from "react";
import {
  Camera,
  Check,
  Globe,
  Mic2,
  MonitorPlay,
  Radio,
  Video,
} from "lucide-react";
import { PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import { TS, readinessUi } from "@/components/todays-service/ServiceUi";
import {
  buildRemainingChecklist,
  hasOpenIssues,
  volunteerReadinessHeadline,
  volunteerStatusLabel,
} from "@/lib/todays-service/coaching";
import type {
  LiveReadinessState,
  PresentationSource,
  ReadinessStatus,
  RecordingSetting,
  TodaysServicePayload,
} from "@/lib/todays-service/types";

type StatusOverviewRowProps = {
  data: TodaysServicePayload;
  setupComplete: boolean;
  cameraCount: number;
  cameraReadyCount: number;
  destinationCount: number;
  recording?: RecordingSetting;
  presentation?: PresentationSource;
  onViewChecklist: () => void;
  onRefresh: () => void;
  onFixIssues: () => void;
  onContinueSetup: () => void;
  onViewSection: (id: string) => void;
  refreshing?: boolean;
};

const MINI_CARDS = [
  { key: "sound", label: "Sound", icon: Mic2, section: "sound", viewLabel: "View Sound" },
  { key: "cameras", label: "Cameras", icon: Camera, section: "cameras", viewLabel: "View Cameras" },
  { key: "internet", label: "Internet", icon: Globe, section: "internet", viewLabel: "View Internet" },
  { key: "livestream", label: "Livestream", icon: Radio, section: "streaming", viewLabel: "View Streaming" },
  { key: "recording", label: "Recording", icon: Video, section: "recording", viewLabel: "View Recording" },
  { key: "presentation", label: "Presentation", icon: MonitorPlay, section: "presentation", viewLabel: "View Presentation" },
] as const;

function sectionSubtitle(
  key: (typeof MINI_CARDS)[number]["key"],
  readiness: LiveReadinessState,
  cameraCount: number,
  cameraReadyCount: number,
  destinationCount: number,
  recording?: RecordingSetting,
  presentation?: PresentationSource,
): string {
  const sectionKey = key === "livestream" ? "livestream" : key;
  const status = readiness.sections[sectionKey as keyof typeof readiness.sections];

  switch (key) {
    case "sound":
      if (status === "not_connected") return "Let's get your sound ready.";
      return status === "ready" ? "Sound is ready to go" : volunteerStatusLabel(status);
    case "cameras":
      if (cameraCount === 0) return "Let's connect your cameras.";
      return `${cameraReadyCount} of ${cameraCount} cameras ready to go`;
    case "internet":
      if (status === "not_connected") return "Let's check your internet.";
      return status === "ready" ? "Connection looks great" : volunteerStatusLabel(status);
    case "livestream":
      if (destinationCount === 0) return "Choose where to stream";
      return `${destinationCount} destination${destinationCount === 1 ? "" : "s"} added`;
    case "recording":
      if (!recording?.saveLocation) return "Let's set up recording";
      if (recording.storageRemainingGb != null) return `${recording.storageRemainingGb} GB remaining`;
      return recording.recordingEnabled ? "Recording is on" : "Recording is ready to turn on";
    case "presentation":
      if (!presentation || presentation.softwareName === "None") return "Connect your slides and lyrics";
      return `${presentation.softwareName} connected`;
    default:
      return volunteerStatusLabel(status);
  }
}

function StatusOverviewRow({
  data,
  setupComplete,
  cameraCount,
  cameraReadyCount,
  destinationCount,
  recording,
  presentation,
  onViewChecklist,
  onRefresh,
  onFixIssues,
  onContinueSetup,
  onViewSection,
  refreshing,
}: StatusOverviewRowProps) {
  const { readiness } = data;
  const percent = readiness.readinessPercent;
  const ringUi = percent >= 80 ? PARABLE_STATUS.green : percent >= 50 ? PARABLE_STATUS.yellow : PARABLE_STATUS.red;
  const checklist = useMemo(() => buildRemainingChecklist(readiness, data), [readiness, data]);
  const allReady = setupComplete;
  const showFixIssues = hasOpenIssues(data);
  const showContinueSetup = !setupComplete;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
      {MINI_CARDS.map((card) => {
        const Icon = card.icon;
        const sectionKey = card.key === "livestream" ? "livestream" : card.key;
        const status = readiness.sections[sectionKey as keyof typeof readiness.sections] as ReadinessStatus;
        const ui = readinessUi(status);

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onViewSection(card.section)}
            className={`${TS.panel} rounded-xl p-3 text-left transition hover:border-[#00f2ff]/30`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className={`rounded-md border p-1.5 ${ui.border} ${ui.bg}`}>
                <Icon className={`h-4 w-4 ${ui.text}`} aria-hidden="true" />
              </div>
              <span className={`font-ui text-[0.52rem] font-bold uppercase tracking-[0.06em] ${ui.text}`}>
                {volunteerStatusLabel(status)}
              </span>
            </div>
            <p className="mt-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white">
              {card.label}
            </p>
            <p className="mt-0.5 font-body text-[0.68rem] text-neutral-400">
              {sectionSubtitle(
                card.key,
                readiness,
                cameraCount,
                cameraReadyCount,
                destinationCount,
                recording,
                presentation,
              )}
            </p>
            <span className={`mt-2 inline-block ${TS.link}`}>{card.viewLabel}</span>
          </button>
        );
      })}

      <section className={`${TS.panel} col-span-2 flex flex-col rounded-xl p-4 md:col-span-3 xl:col-span-1`} aria-live="polite" aria-atomic="true">
        <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white/70">
          Church Readiness
        </p>

        <div className="mt-3 flex flex-col items-center gap-2">
          <div
            className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[3px] ${ringUi.border}`}
          >
            <span className={`font-headline text-2xl ${ringUi.text}`}>{percent}%</span>
          </div>
          <p className={`font-ui text-[0.58rem] font-bold uppercase tracking-[0.08em] ${ringUi.text}`}>
            {volunteerReadinessHeadline(percent)}
          </p>
        </div>

        {allReady ? (
          <div className="mt-3 space-y-1 text-center">
            <p className="font-body text-[0.82rem] font-semibold text-[#53fc18]">
              ✅ Everything looks great!
            </p>
            <p className="font-body text-[0.78rem] text-gray-400">
              You&apos;re ready to begin today&apos;s service.
            </p>
          </div>
        ) : (
          <div className="mt-3 w-full">
            <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] text-white/60">
              {checklist.length} Thing{checklist.length === 1 ? "" : "s"} Left
            </p>
            {checklist.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {checklist.slice(0, 5).map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onViewSection(item.sectionId)}
                    className="flex w-full items-center gap-2 text-left font-body text-[0.78rem] text-white/75 transition hover:text-white"
                  >
                    <span className="text-neutral-500" aria-hidden="true">
                      ☐
                    </span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            ) : null}
          </div>
        )}

        <div className="mt-3 w-full space-y-2 border-t border-white/8 pt-3">
          <div className="flex items-center justify-between">
            <span className={TS.captionMuted}>Overall Readiness</span>
            <span className={`font-headline text-lg ${ringUi.text}`}>{percent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${ringUi.dot}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button type="button" onClick={onViewChecklist} className={`flex-1 ${TS.btnOutline}`}>
              View Checklist
            </button>
            <button
              type="button"
              disabled={refreshing}
              onClick={onRefresh}
              className={`flex-1 ${TS.btnOutline}`}
            >
              {refreshing ? "Checking your equipment…" : "Refresh Check"}
            </button>
          </div>
          {showFixIssues ? (
            <button type="button" onClick={onFixIssues} className={TS.btnGreen}>
              Fix Issues
            </button>
          ) : null}
          {showContinueSetup ? (
            <button type="button" onClick={onContinueSetup} className={TS.btnPrimary}>
              Continue Setup
            </button>
          ) : null}
        </div>

        {allReady ? (
          <p className="mt-2 flex items-center justify-center gap-1 font-ui text-[0.48rem] uppercase tracking-[0.08em] text-[#53fc18]">
            <Check className="h-3 w-3" aria-hidden="true" />
            Ready to begin
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default memo(StatusOverviewRow);
