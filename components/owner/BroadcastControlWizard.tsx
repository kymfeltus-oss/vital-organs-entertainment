"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cloud,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  HelpCircle,
  Home,
  Loader2,
  MonitorPlay,
  Radio,
  Rocket,
  Settings,
  SlidersHorizontal,
  Volume2,
  XCircle,
} from "lucide-react";
import type { OwnerBroadcastSnapshot, OwnerPublisherSession } from "@/lib/owner/contracts";
import type { SelectedCaptureDevices } from "@/components/owner/InAppDeviceCaptureSelectors";
import InAppDeviceCaptureSelectors from "@/components/owner/InAppDeviceCaptureSelectors";
import OwnerCameraPublisher from "@/components/owner/OwnerCameraPublisher";
import OwnerSnapshotTimestamp from "@/components/owner/OwnerSnapshotTimestamp";

const DROP_CURTAIN_SUCCESS_BANNER =
  "Drop-Curtain override successfully broadcast to all connected devices.";

type BroadcastControlWizardProps = {
  snapshot: OwnerBroadcastSnapshot;
  loading?: boolean;
  error?: string | null;
  actionMessage?: string | null;
  operationReceipt?: OperationReceipt;
  actionPending?: boolean;
  hasPendingTasks?: boolean;
  ingestCredentials?: {
    rtmpUrl: string | null;
    streamKey: string | null;
    source?: "env" | "unconfigured";
    detail: string | null;
    loading: boolean;
  };
  publisherSession?: OwnerPublisherSession | null;
  selectedDevices?: SelectedCaptureDevices;
  onDevicesChange?: (devices: SelectedCaptureDevices) => void;
  onStartExternalBroadcast?: () => void;
  onLaunchInAppCamera?: () => void;
  onDropCurtain?: () => void | Promise<boolean>;
  onEndBroadcast?: () => void;
  onRefresh?: () => void;
};

type OperationStatus = "idle" | "pending" | "success" | "blocked" | "error";
type OperationCommand = "external" | "camera" | "dropCurtain" | "end" | null;

type OperationReceipt = {
  status: OperationStatus;
  command: OperationCommand;
  title: string;
  detail: string;
  timestamp: string | null;
};

const IDLE_OPERATION_RECEIPT: OperationReceipt = {
  status: "idle",
  command: null,
  title: "Ready",
  detail: "No broadcast command has been submitted yet.",
  timestamp: null,
};

const navItems = [
  ["Overview", "/owner/show-setup", Home],
  ["Pre-Show Hub", "/owner/show-setup?tab=pre-show", Radio],
  ["Setup", "/owner/show-setup?tab=setup", Settings],
  ["Devices", "/owner/device-inventory", CalendarDays],
  ["Video Preflight", "/owner/video-hub/control", Camera],
  ["Sound Preflight", "/owner/audio-monitoring", Volume2],
  ["Graphics", "/owner/graphics", FileText],
  ["Cockpit", "/owner/cockpit", MonitorPlay],
  ["Countdown", "/owner/countdown", Clock3],
  ["Program Flow", "/owner/show-setup?tab=program-flow", SlidersHorizontal],
  ["Archive / DVR", "/owner/show-setup/archive-settings", Archive],
  ["Automation", "/owner/show-setup?tab=automation", Gauge],
  ["Reports", "/owner/show-setup?tab=reports", FileText],
  ["Settings", "/owner/show-setup?tab=settings", Settings],
] as const;

function persistControlPreference(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(`owner-control-${key}`, value);
    return true;
  } catch {
    return false;
  }
}

function StatusChip({
  icon,
  label,
  value,
  tone = "green",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "green" | "purple" | "white";
}) {
  const valueClass =
    tone === "green" ? "text-[#22E66B]" : tone === "purple" ? "text-[#E15BFF]" : "text-white";
  return (
    <div className="flex min-h-12 items-center gap-3 border-r border-[#1B2B4C] px-5 last:border-r-0">
      <span className={valueClass}>{icon}</span>
      <div>
        <p className="font-body text-[0.68rem] text-white/65">{label}</p>
        <p className={`font-body text-xs font-semibold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function SidebarLink({
  label,
  href,
  icon,
  active = false,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      data-testid={`owner-control-nav-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      href={href}
      className={`flex min-h-12 items-center gap-3 border-l-2 px-5 font-body text-sm ${
        active
          ? "border-[#FF2FCF] bg-gradient-to-r from-[#3B0B38] to-[#0E1A46] text-white"
          : "border-transparent text-white/70 hover:bg-white/5"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function PhaseCard({
  icon,
  eyebrow,
  title,
  subtitle,
  tone,
  dataTestId,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  tone: "blue" | "purple" | "pink";
  dataTestId: string;
}) {
  const toneClass =
    tone === "blue"
      ? "border-[#00A7FF] bg-[#06162A] text-[#42B6FF]"
      : tone === "purple"
        ? "border-[#7B3DFF] bg-[#150B2C] text-[#C566FF]"
        : "border-[#FF2FCF] bg-[#25071F] text-[#FF4CDA]";
  return (
    <div data-testid={dataTestId} className={`min-h-24 rounded-[8px] border p-5 ${toneClass}`}>
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="font-ui text-xs uppercase tracking-[0.1em]">{eyebrow}</p>
          <p className="font-body text-xl font-bold uppercase text-white">{title.replace(/_/g, " ")}</p>
          <p className="font-body text-xs text-white/68">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function titleCaseStatus(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function eventPhaseDisplay(snapshot: OwnerBroadcastSnapshot): { title: string; subtitle: string } {
  const gateState = snapshot.gate.currentState;
  if (gateState === "imminent_live") {
    return {
      title: "Drop Curtain",
      subtitle: snapshot.gate.imminentLiveStartedAt
        ? `Opened ${new Date(snapshot.gate.imminentLiveStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "Attendee gate opening now",
    };
  }
  if (gateState === "live") {
    return { title: "Live", subtitle: "Attendee gate is open" };
  }
  if (gateState === "scheduled" || snapshot.eventPhase.phase === "scheduled") {
    return {
      title: "Scheduled",
      subtitle: snapshot.eventPhase.startTime
        ? `Starts ${new Date(snapshot.eventPhase.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "Waiting for scheduled start",
    };
  }
  if (snapshot.eventPhase.phase === "preshow") {
    return { title: "Pre-Show", subtitle: "Setup window is active" };
  }
  if (snapshot.eventPhase.phase === "ended") {
    return { title: "Ended", subtitle: "Event window complete" };
  }
  return { title: "Idle", subtitle: "No active event gate" };
}

function publishDisplay(snapshot: OwnerBroadcastSnapshot): { title: string; subtitle: string } {
  const { mode, status, errorMessage } = snapshot.publish;
  if (status === "error") {
    return { title: "Error", subtitle: errorMessage ?? "Publisher requires attention" };
  }
  if (status === "publishing") {
    return { title: "Publishing", subtitle: `Mode: ${titleCaseStatus(mode)}` };
  }
  if (status === "starting") {
    return { title: "Starting", subtitle: `Preparing ${titleCaseStatus(mode)} path` };
  }
  if (status === "preflight") {
    return { title: "Preflight", subtitle: "Validating route requirements" };
  }
  if (status === "ending") {
    return { title: "Ending", subtitle: "Closing active publisher" };
  }
  return {
    title: "Offline",
    subtitle: mode === "none" ? "No publisher active" : `Ready for ${titleCaseStatus(mode)}`,
  };
}

function playbackDisplay(snapshot: OwnerBroadcastSnapshot): { title: string; subtitle: string } {
  const { status, errorMessage, manifestReachable, hlsUrl } = snapshot.playback;
  if (status === "error") {
    return { title: "Error", subtitle: errorMessage ?? "Playback requires attention" };
  }
  if (status === "live") {
    return {
      title: "Live",
      subtitle: manifestReachable ? "Manifest reachable" : "Live state active",
    };
  }
  if (status === "playback_pending") {
    return {
      title: "Playback Pending",
      subtitle: hlsUrl ? "Waiting for manifest readiness" : "Awaiting publisher feed",
    };
  }
  if (status === "ready") {
    return {
      title: "Ready",
      subtitle: manifestReachable ? "Manifest verified" : hlsUrl ? "HLS URL configured" : "Ready for route",
    };
  }
  return { title: "Unconfigured", subtitle: "No playback URL configured" };
}

function operationToneClass(status: OperationStatus): string {
  if (status === "success") {
    return "border-[#22E66B]/50 bg-[#071F13] text-[#22E66B]";
  }
  if (status === "blocked") {
    return "border-amber-400/55 bg-amber-950/20 text-amber-200";
  }
  if (status === "error") {
    return "border-red-400/55 bg-red-950/20 text-red-200";
  }
  if (status === "pending") {
    return "border-[#00A7FF]/55 bg-[#06162A] text-[#8EDBFF]";
  }
  return "border-[#263A61] bg-[#071022] text-white/70";
}

function operationLabel(status: OperationStatus): string {
  if (status === "success") return "Confirmed";
  if (status === "blocked") return "Blocked";
  if (status === "error") return "Failed";
  if (status === "pending") return "Processing";
  return "Ready";
}

function ButtonCommandStatus({
  command,
  receipt,
}: {
  command: Exclude<OperationCommand, null>;
  receipt: OperationReceipt;
}) {
  if (receipt.command !== command || receipt.status === "idle") {
    return (
      <div
        data-testid={`owner-control-${command}-button-status`}
        className="mt-3 rounded-[7px] border border-[#263A61] bg-[#071022] px-3 py-2 font-body text-xs text-white/55"
      >
        Ready. Click the button to run the live backend process.
      </div>
    );
  }

  const icon =
    receipt.status === "pending" ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : receipt.status === "success" ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : (
      <XCircle className="h-4 w-4" />
    );

  return (
    <div
      data-testid={`owner-control-${command}-button-status`}
      role={receipt.status === "error" || receipt.status === "blocked" ? "alert" : "status"}
      className={`mt-3 rounded-[7px] border px-3 py-2 font-body text-xs ${operationToneClass(receipt.status)}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold text-white">
          {icon}
          {operationLabel(receipt.status)}
        </span>
        {receipt.timestamp ? (
          <span className="font-ui text-[0.62rem] uppercase tracking-[0.12em] text-white/55">
            {receipt.timestamp}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-white/72">{receipt.detail}</p>
    </div>
  );
}

function buttonLabelForCommand(
  command: Exclude<OperationCommand, null>,
  receipt: OperationReceipt,
  defaultLabel: string,
): string {
  if (receipt.command !== command) return defaultLabel;
  if (receipt.status === "pending") return "Running...";
  if (receipt.status === "success") return "Confirmed";
  if (receipt.status === "blocked") return "Blocked";
  if (receipt.status === "error") return "Failed";
  return defaultLabel;
}

async function writeClipboardText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy selection path.
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function CredentialBox({
  label,
  value,
  masked = false,
  revealed = false,
  onToggleReveal,
  onCopy,
}: {
  label: string;
  value: string;
  masked?: boolean;
  revealed?: boolean;
  onToggleReveal?: () => void;
  onCopy: (value: string, label: string) => void;
}) {
  const configured = Boolean(value);
  const visible = !configured ? "Not configured" : masked && !revealed ? "•".repeat(Math.min(value.length, 32)) : value;
  const testIdBase = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <label className="block">
      <span className="font-ui text-xs uppercase tracking-[0.18em] text-white/60">{label}</span>
      <div className={`mt-2 grid gap-3 ${masked ? "grid-cols-[1fr_3rem_3rem]" : "grid-cols-[1fr_3rem]"}`}>
        <input
          data-testid={`owner-control-${testIdBase}-field`}
          readOnly
          value={visible}
          onFocus={(event) => event.currentTarget.select()}
          className="min-h-12 min-w-0 rounded-[6px] border border-[#7B3DFF]/70 bg-[#070A16] px-4 font-body text-base text-white outline-none selection:bg-[#FF2FCF]/40 focus:border-[#00DDEB] focus:shadow-[0_0_18px_rgba(0,221,235,0.2)]"
        />
        {masked ? (
          <button
            data-testid={`owner-control-${testIdBase}-reveal-button`}
            type="button"
            disabled={!configured}
            onClick={onToggleReveal}
            className="grid h-12 w-12 place-items-center rounded-[6px] border border-[#7B3DFF]/70 bg-[#070A16] text-white disabled:opacity-40"
            aria-label={revealed ? `Hide ${label}` : `Reveal ${label}`}
            aria-pressed={revealed}
          >
            {revealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        ) : null}
        <button
          data-testid={`owner-control-copy-${testIdBase}`}
          type="button"
          disabled={!configured}
          onClick={() => onCopy(value, label)}
          className="grid h-12 w-12 place-items-center rounded-[6px] border border-[#7B3DFF]/70 bg-[#070A16] text-white disabled:opacity-40"
          aria-label={`Copy ${label}`}
        >
          <Copy className="h-5 w-5" />
        </button>
      </div>
    </label>
  );
}

export default function BroadcastControlWizard({
  snapshot,
  loading = false,
  error = null,
  actionMessage = null,
  operationReceipt = IDLE_OPERATION_RECEIPT,
  actionPending = false,
  hasPendingTasks = false,
  ingestCredentials = { rtmpUrl: null, streamKey: null, detail: null, loading: true },
  publisherSession = null,
  selectedDevices,
  onDevicesChange,
  onStartExternalBroadcast = () => {},
  onLaunchInAppCamera = () => {},
  onDropCurtain = () => {},
  onEndBroadcast = () => {},
  onRefresh = () => {},
}: BroadcastControlWizardProps) {
  const [isOverriding, setIsOverriding] = useState(false);
  const [dropCurtainSuccessVisible, setDropCurtainSuccessVisible] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [localTone, setLocalTone] = useState<"info" | "success" | "error">("info");
  const [streamKeyRevealed, setStreamKeyRevealed] = useState(false);

  const publisherStarting = snapshot.publish.status === "starting";
  const publisherEnding = snapshot.publish.status === "ending";
  const publisherActive =
    snapshot.publish.status === "publishing" || publisherStarting;
  const controlsBusy = actionPending || publisherStarting || publisherEnding;
  const canEndBroadcast =
    publisherActive ||
    snapshot.playback.status === "live" ||
    snapshot.playback.status === "playback_pending" ||
    snapshot.gate.currentState === "imminent_live" ||
    snapshot.gate.currentState === "live";
  const streamKey = ingestCredentials.streamKey ?? "";
  const rtmpUrl = ingestCredentials.rtmpUrl ?? "";
  const hasSelectedHardware = Boolean(selectedDevices?.videoDeviceId && selectedDevices?.audioDeviceId);
  const eventPhaseCard = eventPhaseDisplay(snapshot);
  const publishCard = publishDisplay(snapshot);
  const playbackCard = playbackDisplay(snapshot);

  const handleCopy = useCallback(async (value: string, label: string) => {
    if (!value) {
      setLocalTone("error");
      setLocalMessage(`${label} is unavailable.`);
      return;
    }
    try {
      const copied = await writeClipboardText(value);
      if (!copied) {
        throw new Error("Clipboard write failed.");
      }
      setLocalTone("success");
      setLocalMessage(`${label} copied.`);
    } catch {
      setLocalTone("error");
      setLocalMessage(`${label} copy failed.`);
    }
  }, []);

  const credentialSource =
    ingestCredentials.source === "env"
      ? "Generated from server environment: CUSTOM_RTMP_URL and CUSTOM_RTMP_STREAM_KEY."
      : "Not generated yet. Configure CUSTOM_RTMP_URL and CUSTOM_RTMP_STREAM_KEY on the server.";
  const externalButtonLabel = buttonLabelForCommand(
    "external",
    operationReceipt,
    "Start Main External Broadcast",
  );
  const cameraButtonLabel = buttonLabelForCommand(
    "camera",
    operationReceipt,
    "Launch In-App Device Camera Stream",
  );

  const handleExternalStart = useCallback(() => {
    if (!rtmpUrl || !streamKey) {
      setLocalTone("error");
      setLocalMessage("RTMP URL and stream key are required before starting external broadcast.");
      return;
    }
    if (publisherStarting || publisherEnding) {
      setLocalTone("error");
      setLocalMessage("Broadcast routing is already changing. Wait for this request to finish before starting another.");
      return;
    }
    setLocalMessage(null);
    onStartExternalBroadcast();
  }, [onStartExternalBroadcast, publisherEnding, publisherStarting, rtmpUrl, streamKey]);

  const handleCameraLaunch = useCallback(() => {
    if (publisherStarting || publisherEnding) {
      setLocalTone("error");
      setLocalMessage("Broadcast routing is already changing. Wait for this request to finish before launching camera mode.");
      return;
    }
    if (!hasSelectedHardware) {
      setLocalTone("error");
      setLocalMessage("Detect and select both camera and microphone before launching browser camera stream.");
      return;
    }
    setLocalMessage(null);
    onLaunchInAppCamera();
  }, [hasSelectedHardware, onLaunchInAppCamera, publisherEnding, publisherStarting]);

  const handleDropCurtainClick = useCallback(() => {
    if (isOverriding) return;
    setIsOverriding(true);
    setDropCurtainSuccessVisible(false);
    setLocalMessage(null);
    void (async () => {
      try {
        const result = await onDropCurtain();
        if (result === true) {
          setDropCurtainSuccessVisible(true);
          setLocalTone("success");
          setLocalMessage(DROP_CURTAIN_SUCCESS_BANNER);
        }
      } finally {
        setIsOverriding(false);
      }
    })();
  }, [isOverriding, onDropCurtain]);

  const visibleMessage = error ?? actionMessage ?? localMessage;
  const messageTone = useMemo(() => {
    if (error) return "border-red-400/45 bg-red-500/10 text-red-200";
    if (actionMessage && operationReceipt.status !== "idle") {
      return operationToneClass(operationReceipt.status);
    }
    if (localTone === "success" || dropCurtainSuccessVisible) {
      return "border-[#22E66B]/45 bg-[#082113] text-[#22E66B]";
    }
    if (localTone === "error") return "border-red-400/45 bg-red-500/10 text-red-200";
    return "border-[#263A61] bg-[#071022] text-white/72";
  }, [actionMessage, dropCurtainSuccessVisible, error, localTone, operationReceipt.status]);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#02040A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_22%_10%,rgba(255,47,207,0.12),transparent_27%),radial-gradient(circle_at_82%_14%,rgba(0,167,255,0.13),transparent_28%),linear-gradient(180deg,#030611_0%,#02040A_100%)]" />

      <div className="relative grid min-h-dvh 2xl:grid-cols-[11rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#17233B] bg-[#050914]/95 2xl:flex 2xl:flex-col">
          <div className="flex h-[5.75rem] items-center gap-3 border-b border-[#17233B] px-4">
            <div className="grid h-11 w-11 place-items-center rounded-[7px] border border-[#00DDEB] font-headline text-4xl text-transparent [-webkit-text-stroke:1px_#FF4CDA]">
              P
            </div>
            <div>
              <p className="font-body text-sm uppercase tracking-[0.32em]">Parable</p>
              <p className="font-body text-[0.58rem] uppercase tracking-[0.38em] text-white/60">Entertainment</p>
            </div>
          </div>
          <nav className="flex-1 py-4">
            {navItems.map(([label, href, Icon]) => (
              <SidebarLink
                key={label}
                label={label}
                href={href}
                active={label === "Pre-Show Hub"}
                icon={<Icon className="h-4 w-4" />}
              />
            ))}
          </nav>
          <div className="border-t border-[#17233B] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-[#FF2FCF] font-headline text-3xl text-transparent [-webkit-text-stroke:1px_#00DDEB]">
                P
              </div>
              <div>
                <p className="font-body text-xs font-semibold">Parable Producer</p>
                <p className="font-body text-[0.65rem] text-white/55">Owner</p>
              </div>
            </div>
            <p className="mt-3 font-body text-[0.65rem] text-[#22E66B]">Online</p>
            <button
              data-testid="owner-control-collapse-sidebar-button"
              type="button"
              onClick={() => {
                const saved = persistControlPreference("sidebar-collapsed", "true");
                setLocalTone(saved ? "success" : "error");
                setLocalMessage(
                  saved
                    ? "Sidebar collapsed preference saved for this browser."
                    : "Sidebar preference could not be saved in this browser.",
                );
              }}
              className="mt-5 font-body text-xs text-white/55"
            >
              Collapse
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex min-h-[5.75rem] flex-wrap items-center gap-3 border-b border-[#17233B] px-3 py-3 sm:px-5">
            <div className="min-w-[14rem] flex-1">
              <h1 className="font-headline text-2xl uppercase leading-none tracking-[0.02em] sm:text-3xl">
                Show Setup <span className="text-[#FF4CDA]">Control</span>{" "}
                <span className="text-[#7EA7FF]">Center</span>
              </h1>
              <p className="mt-1 font-body text-sm text-[#00DDEB]">
                Configure. Verify. <span className="text-[#FF4CDA]">Operate.</span>
              </p>
            </div>
            <div className="grid w-full grid-cols-2 rounded-[7px] border border-[#1B2B4C] bg-[#071022] lg:w-auto lg:min-w-[30rem] lg:grid-cols-4 2xl:min-w-[40rem]">
              <StatusChip icon={<Cloud className="h-5 w-5" />} label="Cloud Sync" value="Connected" />
              <StatusChip icon={<CalendarDays className="h-5 w-5" />} label="Event State" value="Pre-Show" tone="purple" />
              <StatusChip icon={<Gauge className="h-5 w-5" />} label="Stream Relay" value="Ready" />
              <StatusChip
                icon={<CalendarDays className="h-5 w-5" />}
                label="Last Sync"
                value={snapshot.capturedAt ? new Date(snapshot.capturedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Pending"}
                tone="white"
              />
            </div>
            <Link
              data-testid="owner-control-device-manager-link"
              href="/owner/device-inventory"
              className="flex min-h-11 items-center gap-2 rounded-[7px] border border-[#00DDEB] px-3 font-ui text-xs uppercase text-[#00DDEB] sm:px-5"
            >
              <MonitorPlay className="h-4 w-4" />
              Device Manager
            </Link>
            <Link
              data-testid="owner-control-open-broadcast-control-link"
              href="/owner/control"
              className="flex min-h-11 items-center gap-2 rounded-[7px] bg-gradient-to-r from-[#D00074] to-[#0B5DFF] px-3 font-ui text-xs uppercase sm:px-6"
            >
              Open Broadcast Control
              <ChevronRight className="h-4 w-4" />
            </Link>
            <button
              data-testid="owner-control-help-button"
              type="button"
              onClick={() => {
                const saved = persistControlPreference("help-opened", new Date().toISOString());
                setLocalTone(saved ? "success" : "error");
                setLocalMessage(
                  saved
                    ? "Broadcast Control help state saved for this browser."
                    : "Help state could not be saved in this browser.",
                );
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#263A61]"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </header>

          <div className="px-3 py-4 sm:px-5">
            {visibleMessage ? (
              <div className={`mb-4 rounded-[8px] border px-4 py-3 font-body text-sm ${messageTone}`}>
                {visibleMessage}
              </div>
            ) : null}

            {operationReceipt.status !== "idle" ? (
              <div
                data-testid="owner-control-operation-receipt"
                role={operationReceipt.status === "error" || operationReceipt.status === "blocked" ? "alert" : "status"}
                className={`mb-4 rounded-[8px] border px-4 py-3 font-body ${operationToneClass(operationReceipt.status)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-ui text-xs uppercase tracking-[0.16em]">
                      {operationLabel(operationReceipt.status)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {operationReceipt.title}
                    </p>
                  </div>
                  <p className="font-ui text-[0.68rem] uppercase tracking-[0.14em] text-white/60">
                    {operationReceipt.timestamp ? `Checked ${operationReceipt.timestamp}` : "Pending"}
                  </p>
                </div>
                <p className="mt-2 text-sm text-white/78">{operationReceipt.detail}</p>
              </div>
            ) : null}

            <section className="mb-6 grid min-h-[7.25rem] items-center rounded-[8px] border border-red-500/65 bg-red-950/10 px-4 py-5 shadow-[0_0_24px_rgba(248,113,113,0.12)] xl:grid-cols-[1fr_minmax(22rem,39rem)] xl:px-8">
              <div className="flex items-center gap-6">
                <AlertTriangle className="h-11 w-11 shrink-0 fill-red-400 text-red-400" />
                <div>
                  <h2 className="font-ui text-lg uppercase tracking-[0.14em] text-red-400">
                    Emergency Override: Open Gates Immediately
                  </h2>
                  <p className="mt-3 max-w-4xl font-body text-sm text-white/82">
                    Bypasses schedule calendars, opens the live show, and notifies all attendee screens instantly.
                    <br />
                    Does not modify countdown configuration.
                  </p>
                </div>
              </div>
              <button
                data-testid="owner-control-drop-curtain-button"
                type="button"
                disabled={isOverriding}
                aria-busy={isOverriding}
                onClick={handleDropCurtainClick}
                className="min-h-20 rounded-[9px] border-2 border-red-400 bg-red-950/20 px-4 text-right shadow-[0_0_24px_rgba(248,113,113,0.48)] disabled:opacity-45 sm:px-8"
              >
                <span className="block font-ui text-lg uppercase tracking-[0.18em] text-red-400">
                  Drop Curtain:
                </span>
                <span className="mt-1 flex items-center justify-end gap-8 font-ui text-sm uppercase tracking-[0.22em] text-white">
                  Bypass system calendars and open live show right now
                  <ChevronRight className="h-7 w-7" />
                </span>
              </button>
            </section>

            <header className="mb-4 grid gap-4 lg:grid-cols-3 xl:grid-cols-[1fr_13rem_13rem_13rem] 2xl:grid-cols-[1fr_15rem_15rem_15rem] xl:items-end">
              <div>
                <p className="font-ui text-sm uppercase tracking-[0.28em] text-[#4A6CFF]">
                  Broadcast Control
                </p>
                <h2 className="mt-2 font-headline text-3xl uppercase tracking-[0.02em] sm:text-4xl">
                  Master <span className="text-[#B8A7FF]">Setup</span>{" "}
                  <span className="text-[#D853FF]">Wizard</span>
                </h2>
                <p className="mt-3 font-body text-sm text-white/65">
                  Choose an ingest path, resolve setup tasks, then activate the live broadcast gate.
                </p>
              </div>
              <PhaseCard
                dataTestId="owner-control-event-phase-card"
                icon={<CalendarDays className="h-8 w-8" />}
                eyebrow="Event Phase"
                title={eventPhaseCard.title}
                subtitle={eventPhaseCard.subtitle}
                tone="blue"
              />
              <PhaseCard
                dataTestId="owner-control-publish-card"
                icon={<Radio className="h-8 w-8" />}
                eyebrow="Publish"
                title={publishCard.title}
                subtitle={publishCard.subtitle}
                tone="purple"
              />
              <PhaseCard
                dataTestId="owner-control-playback-card"
                icon={<MonitorPlay className="h-8 w-8" />}
                eyebrow="Playback"
                title={playbackCard.title}
                subtitle={playbackCard.subtitle}
                tone="pink"
              />
            </header>

            {hasPendingTasks ? (
              <div
                data-testid="owner-control-pending-tasks-alert"
                role="alert"
                className="mb-5 grid min-h-20 items-center gap-4 rounded-[8px] border border-amber-500/60 bg-amber-950/10 px-4 py-4 lg:grid-cols-[1fr_18rem] xl:grid-cols-[1fr_22rem] xl:px-7"
              >
                <div className="flex items-center gap-5">
                  <AlertTriangle className="h-8 w-8 fill-amber-400 text-amber-400" />
                  <div>
                    <p className="font-ui text-lg uppercase text-amber-300">
                      Pending Tasks: <span className="font-body text-sm normal-case">You have unresolved setup requirements.</span>
                    </p>
                    <p className="mt-1 font-body text-sm text-amber-100/85">
                      Review your Pre-Show checklist before going live.
                    </p>
                  </div>
                </div>
                <Link
                  data-testid="owner-control-pre-show-checklist-link"
                  href="/owner/show-setup?tab=pre-show"
                  className="inline-flex min-h-12 items-center justify-center gap-6 rounded-[7px] border border-amber-400/70 bg-black/25 font-ui text-xs uppercase tracking-[0.18em] text-white"
                >
                  View Pre-Show Checklist
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            ) : null}

            <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr] 2xl:gap-7">
              <article className="rounded-[9px] border border-[#FF2FCF]/75 bg-[#09091A]/88 p-6 shadow-[0_0_24px_rgba(255,47,207,0.17)]">
                <h3 className="font-ui text-lg uppercase tracking-[0.08em] text-[#D853FF]">
                  Option 1: Broadcast via External App
                </h3>
                <p className="mt-3 font-body text-sm text-white/65">vMix / OBS / Larix - Restream RTMP</p>
                <p className="mt-5 font-body text-sm text-white">
                  {ingestCredentials.loading
                    ? "Loading RTMP credentials..."
                    : ingestCredentials.detail ?? "Restream / custom RTMP credentials loaded."}
                </p>
                <p
                  data-testid="owner-control-ingest-credential-source"
                  className="mt-2 font-body text-xs text-white/50"
                >
                  {credentialSource}
                </p>

                <div className="mt-6 space-y-6">
                  <CredentialBox label="Custom RTMP URL" value={rtmpUrl} onCopy={handleCopy} />
                  <CredentialBox
                    label="Stream Key"
                    value={streamKey}
                    masked
                    revealed={streamKeyRevealed}
                    onToggleReveal={() => setStreamKeyRevealed((current) => !current)}
                    onCopy={handleCopy}
                  />
                </div>

                <p className="mt-5 font-body text-xs text-white/55">
                  Paste these into vMix, OBS, or Larix on the production machine.
                  <br />
                  Visible only to authorized owner accounts.
                </p>

                <button
                  data-testid="owner-control-start-external-broadcast-button"
                  type="button"
                  disabled={controlsBusy}
                  onClick={handleExternalStart}
                  className="mt-7 min-h-16 w-full rounded-[7px] bg-gradient-to-r from-[#D80A86] via-[#7B3DFF] to-[#00A7FF] px-6 font-ui text-sm uppercase tracking-[0.18em] text-white shadow-[0_0_24px_rgba(0,167,255,0.36)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Rocket className="mr-4 inline h-5 w-5" />
                  {externalButtonLabel}
                </button>
                <ButtonCommandStatus command="external" receipt={operationReceipt} />
              </article>

              <article className="rounded-[9px] border border-[#00A7FF]/75 bg-[#06111F]/88 p-6 shadow-[0_0_24px_rgba(0,167,255,0.17)]">
                <h3 className="font-ui text-lg uppercase tracking-[0.08em] text-[#3E75FF]">
                  Option 2: Broadcast via This Device&apos;s Camera
                </h3>
                <p className="mt-3 font-body text-sm text-white/65">
                  WebRTC break-glass path - uses selected device hardware
                </p>

                <div className="mt-6">
                  <InAppDeviceCaptureSelectors
                    disabled={controlsBusy}
                    onSelectionChange={onDevicesChange}
                  />
                </div>

                <button
                  data-testid="owner-control-launch-in-app-camera-button"
                  type="button"
                  disabled={controlsBusy}
                  onClick={handleCameraLaunch}
                  className="mt-7 min-h-16 w-full rounded-[7px] bg-gradient-to-r from-[#D80A86] via-[#7B3DFF] to-[#00A7FF] px-6 font-ui text-sm uppercase tracking-[0.18em] text-white shadow-[0_0_24px_rgba(0,167,255,0.36)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Camera className="mr-4 inline h-5 w-5" />
                  {cameraButtonLabel}
                </button>
                <ButtonCommandStatus command="camera" receipt={operationReceipt} />
              </article>
            </section>

            {publisherSession ? (
              <section className="mt-5 rounded-[9px] border border-[#00A7FF]/45 bg-[#06111F]/75 p-4">
                <OwnerCameraPublisher
                  embedded
                  liveChannel={publisherSession.channel}
                  browserChannel={publisherSession.browserChannel}
                  sessionId={publisherSession.sessionId}
                  videoDeviceId={selectedDevices?.videoDeviceId}
                  audioDeviceId={selectedDevices?.audioDeviceId}
                  autoStart
                />
              </section>
            ) : null}

            <section className="mt-5 flex flex-wrap items-center gap-3">
              <button
                data-testid="owner-control-refresh-status-button"
                type="button"
                disabled={actionPending}
                onClick={onRefresh}
                className="min-h-10 rounded-full border border-[#263A61] px-5 font-ui text-xs uppercase tracking-[0.14em] text-white disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh status"}
              </button>
              <button
                data-testid="owner-control-end-broadcast-button"
                type="button"
                disabled={actionPending || !canEndBroadcast}
                onClick={onEndBroadcast}
                className="min-h-10 rounded-full border border-red-400/40 px-5 font-ui text-xs uppercase tracking-[0.14em] text-red-300 disabled:opacity-50"
              >
                End broadcast
              </button>
              <span className="font-body text-xs text-white/45">
                <OwnerSnapshotTimestamp capturedAt={snapshot.capturedAt} />
              </span>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
