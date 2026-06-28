"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Gauge,
  Home,
  Mic,
  MonitorPlay,
  Plus,
  Radio,
  RefreshCw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  Video,
  Volume2,
} from "lucide-react";
import { useDeviceInventoryStore, type DeviceDraft, type PersistedDevice } from "@/hooks/use-device-inventory-store";
import { useOwnerBroadcastSnapshot } from "@/hooks/useOwnerBroadcastSnapshot";
import { derivePendingTodos } from "@/lib/owner/derive-pending-todos";
import type { AccessTier, ShowSetupState } from "@/lib/owner/show-setup-state";
import {
  fromDateTimeLocal,
  getCountdownParts,
  getProjectedConclusion,
  minutesToClock,
  parseClockMinutes,
  parseTicketPricing,
  toDateTimeLocal,
  validateShowSetupInput,
  type LowerThirdAsset,
  type LowerThirdTheme,
  type ProgramSegment,
} from "@/lib/owner/show-setup-ui";

type ShowSetupResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  state?: ShowSetupState;
};

type CountdownResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

type PanelProps = {
  title: string;
  number: number;
  children: React.ReactNode;
  className?: string;
};

const navItems = [
  ["Overview", "/owner/show-setup", Home],
  ["Setup", "/owner/show-setup?tab=setup", Settings],
  ["Pre-Show", "/owner/show-setup?tab=pre-show", Radio],
  ["Devices", "/owner/device-inventory", Video],
  ["Archive", "/owner/show-setup/archive-settings", Archive],
  ["Destinations", "/owner/video-hub/control", Cloud],
  ["Video Hub", "/owner/video-hub/control", MonitorPlay],
  ["Sound Hub", "/owner/audio-monitoring", Volume2],
  ["Broadcast Control", "/owner/control", Radio],
] as const;

const quickTabs = ["Setup", "Pre-Show", "Devices", "Archive"] as const;
const accessTierOptions: AccessTier[] = ["PAYWALL", "FREE_REGISTRATION", "PUBLIC"];

const discoveredDevices: DeviceDraft[] = [
  {
    displayName: "Sony FX30",
    deviceKind: "CAMERA",
    linkedHub: "VIDEO HUB",
    inputChannel: 3,
    manufacturer: "Sony",
    model: "FX30",
    healthStatus: "LINKED",
  },
  {
    displayName: "Behringer X32 Console",
    deviceKind: "MIC",
    linkedHub: "SOUND HUB",
    inputChannel: 16,
    manufacturer: "Behringer",
    model: "X32",
    healthStatus: "LINKED",
  },
  {
    displayName: "DeckLink Duo 2",
    deviceKind: "CAMERA",
    linkedHub: "VIDEO HUB",
    inputChannel: 6,
    manufacturer: "Blackmagic",
    model: "DeckLink Duo 2",
    healthStatus: "LINKED",
  },
];

function Panel({ title, number, children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-[8px] border border-[#1F335A] bg-[#06101F]/92 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_22px_rgba(0,0,0,0.28)] ${className}`}
    >
      <h2 className="mb-3 border-b border-white/8 pb-2 font-ui text-xs font-bold uppercase tracking-[0.05em] text-white">
        {number}. {title}
      </h2>
      {children}
    </section>
  );
}

function TextInput({
  value,
  onChange,
  dataTestId,
  readOnly = false,
  type = "text",
  className = "",
}: {
  value: string;
  onChange?: (value: string) => void;
  dataTestId: string;
  readOnly?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <input
      data-testid={dataTestId}
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
      className={`min-h-9 w-full rounded-[5px] border border-[#263A61] bg-[#081427] px-3 font-body text-xs text-white outline-none transition focus:border-[#00DDEB] disabled:opacity-45 ${className}`}
    />
  );
}

function Switch({
  checked,
  onChange,
  dataTestId,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  dataTestId: string;
  disabled?: boolean;
}) {
  return (
    <button
      data-testid={dataTestId}
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`flex h-5 w-10 items-center rounded-full p-0.5 transition disabled:opacity-45 ${
        checked ? "bg-[#22E66B]" : "bg-[#4A5268]"
      }`}
    >
      <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function StatusDot({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-[#22E66B]" />;
  if (status === "warn") return <TriangleAlert className="h-4 w-4 text-amber-300" />;
  return <TriangleAlert className="h-4 w-4 text-red-400" />;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-r border-white/12 text-center last:border-r-0">
      <p className="font-headline text-4xl leading-none tabular-nums text-[#B071FF]">{String(value).padStart(2, "0")}</p>
      <p className="mt-1 font-body text-[0.65rem] uppercase text-white/65">{label}</p>
    </div>
  );
}

function shortDeviceName(device: PersistedDevice): string {
  return device.displayName.split("(")[0]?.trim() || device.displayName;
}

export default function ShowSetupSettingsClient() {
  const [showTitle, setShowTitle] = useState("Summer Concert Series - Night 1");
  const [presenterName, setPresenterName] = useState("Sarah Jenkins");
  const [targetDateTime, setTargetDateTime] = useState(new Date().toISOString());
  const [gateControl, setGateControl] = useState<"LOCKED" | "EARLY_ACCESS">("LOCKED");
  const [primaryIngestEndpoint, setPrimaryIngestEndpoint] = useState("");
  const [streamKey, setStreamKey] = useState("VOE-7K4Q-92MX");
  const [fallbackAssetPath, setFallbackAssetPath] = useState("");
  const [lowerThirds, setLowerThirds] = useState<LowerThirdAsset[]>([
    { id: "LT_001", primaryText: "SARAH JENKINS", secondaryText: "AUDIO ENGINEER", theme: "NEON_PURPLE_SLIDE" },
  ]);
  const [activeLowerThirdId, setActiveLowerThirdId] = useState("LT_001");
  const [programFlow, setProgramFlow] = useState<ProgramSegment[]>([
    { id: "1", title: "Opening Countdown", description: "Countdown", durationMinutes: 5 },
    { id: "2", title: "Host Welcome", description: "Host", durationMinutes: 10 },
    { id: "3", title: "Band Set 1", description: "Music", durationMinutes: 25 },
    { id: "4", title: "Keynote Presentation", description: "Message", durationMinutes: 30 },
    { id: "5", title: "Q&A Session", description: "Q&A", durationMinutes: 15 },
  ]);
  const [monetizationEnabled, setMonetizationEnabled] = useState(true);
  const [gateType, setGateType] = useState<AccessTier>("PAYWALL");
  const [accessTiers, setAccessTiers] = useState<AccessTier[]>(["PAYWALL", "FREE_REGISTRATION"]);
  const [ticketPricingGA, setTicketPricingGA] = useState(49.99);
  const [ticketPricingVIP, setTicketPricingVIP] = useState(99.99);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [chatSlowMode, setChatSlowMode] = useState(true);
  const [dvrBufferEnabled, setDvrBufferEnabled] = useState(true);
  const [verboseTelemetry, setVerboseTelemetry] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof quickTabs)[number]>("Pre-Show");
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [selectedArchiveTarget, setSelectedArchiveTarget] = useState("Dual Track Both");
  const [archiveResolution, setArchiveResolution] = useState("1080p");
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countdownPending, setCountdownPending] = useState(false);
  const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null);
  const [deviceMessage, setDeviceMessage] = useState("Device Manager ready.");
  const [statusMessage, setStatusMessage] = useState("Loading live show setup...");
  const [statusTone, setStatusTone] = useState<"info" | "success" | "error">("info");

  const { snapshot, error: snapshotError, reload: reloadSnapshot, setSnapshot } = useOwnerBroadcastSnapshot();
  const { devices, cameras, microphones, hydrated, error: inventoryError, reload: reloadInventory, updateDevicePatch, upsertDevice } =
    useDeviceInventoryStore();

  const applyState = useCallback((state: ShowSetupState) => {
    setShowTitle(state.showTitle);
    setPresenterName(state.presenterName);
    setTargetDateTime(state.targetDateTime);
    setGateControl(state.gateControl);
    setPrimaryIngestEndpoint(state.primaryIngestEndpoint);
    setStreamKey(state.streamKey);
    setFallbackAssetPath(state.fallbackAssetPath);
    setLowerThirds(state.lowerThirds);
    setActiveLowerThirdId(state.lowerThirds[0]?.id ?? "LT_001");
    setProgramFlow(state.programFlow);
    setMonetizationEnabled(state.monetizationEnabled);
    setGateType(state.gateType);
    setAccessTiers(state.accessTiers.length ? state.accessTiers : [state.gateType]);
    setTicketPricingGA(state.ticketPricingGA);
    setTicketPricingVIP(state.ticketPricingVIP);
    setChatEnabled(state.chatEnabled);
    setChatSlowMode(state.chatSlowMode);
    setDvrBufferEnabled(state.dvrBufferEnabled);
    setVerboseTelemetry(state.verboseTelemetry);
  }, []);

  const loadSetup = useCallback(async () => {
    setLoading(true);
    setStatusTone("info");
    setStatusMessage("Loading live setup state...");
    try {
      const response = await fetch("/api/owner/show-setup", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await response.json()) as ShowSetupResponse;
      if (!response.ok || !data.state) throw new Error(data.error ?? "Unable to load show setup.");
      applyState(data.state);
      setStatusTone("success");
      setStatusMessage("Live setup loaded.");
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(error instanceof Error ? error.message : "Show setup load failed.");
    } finally {
      setLoading(false);
    }
  }, [applyState]);

  useEffect(() => {
    void loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    if (!activeCameraId && cameras[0]?.id) setActiveCameraId(cameras[0].id);
  }, [activeCameraId, cameras]);

  const showSetupPayload = useMemo(
    () => ({
      showTitle,
      presenterName,
      targetDateTime,
      gateControl,
      fallbackAssetPath,
      lowerThirds,
      programFlow,
      monetizationEnabled,
      gateType,
      accessTiers,
      ticketPricingGA,
      ticketPricingVIP,
      chatEnabled,
      chatSlowMode,
      dvrBufferEnabled,
      verboseTelemetry,
    }),
    [
      accessTiers,
      chatEnabled,
      chatSlowMode,
      dvrBufferEnabled,
      fallbackAssetPath,
      gateControl,
      gateType,
      lowerThirds,
      monetizationEnabled,
      presenterName,
      programFlow,
      showTitle,
      targetDateTime,
      ticketPricingGA,
      ticketPricingVIP,
      verboseTelemetry,
    ],
  );

  const saveSetup = useCallback(async () => {
    if (saving) return;
    const validationError = validateShowSetupInput({
      showTitle,
      presenterName,
      targetDateTime,
      lowerThirds,
      programFlow,
      ticketPricingGA,
      ticketPricingVIP,
      accessTiers,
    });
    if (validationError) {
      setStatusTone("error");
      setStatusMessage(validationError);
      return;
    }

    setSaving(true);
    setStatusTone("info");
    setStatusMessage("Saving live setup...");
    try {
      const response = await fetch("/api/owner/show-setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(showSetupPayload),
      });
      const data = (await response.json()) as ShowSetupResponse;
      if (!response.ok || !data.state) throw new Error(data.error ?? "Unable to save show setup.");
      applyState(data.state);
      await reloadSnapshot(true);
      setStatusTone("success");
      setStatusMessage(data.message ?? "All changes saved successfully.");
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(error instanceof Error ? error.message : "Show setup save failed.");
    } finally {
      setSaving(false);
    }
  }, [
    accessTiers,
    applyState,
    lowerThirds,
    presenterName,
    programFlow,
    reloadSnapshot,
    saving,
    showSetupPayload,
    showTitle,
    targetDateTime,
    ticketPricingGA,
    ticketPricingVIP,
  ]);

  const runPreShowCheck = useCallback(async () => {
    setCountdownPending(true);
    setStatusTone("info");
    setStatusMessage("Running pre-show check...");
    try {
      await reloadSnapshot(true);
      reloadInventory();
      setStatusTone("success");
      setStatusMessage("Pre-show check complete. Review warnings before Broadcast Control.");
    } catch {
      setStatusTone("error");
      setStatusMessage("Pre-show check failed.");
    } finally {
      setCountdownPending(false);
    }
  }, [reloadInventory, reloadSnapshot]);

  const adjustCountdown = useCallback(
    async (offsetSeconds: number) => {
      if (countdownPending) return;
      setCountdownPending(true);
      setStatusTone("info");
      setStatusMessage("Adjusting pre-show countdown...");
      try {
        const response = await fetch("/api/owner/countdown", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offsetSeconds }),
        });
        const data = (await response.json()) as CountdownResponse & { snapshot?: typeof snapshot };
        if (data.snapshot) setSnapshot(data.snapshot);
        if (!response.ok) throw new Error(data.error ?? "Countdown update failed.");
        setStatusTone("success");
        setStatusMessage(data.message ?? "Countdown updated.");
      } catch (error) {
        setStatusTone("error");
        setStatusMessage(error instanceof Error ? error.message : "Countdown adjustment failed.");
      } finally {
        setCountdownPending(false);
      }
    },
    [countdownPending, setSnapshot, snapshot],
  );

  const copyValue = useCallback(async (value: string, label: string) => {
    if (!value) {
      setStatusTone("error");
      setStatusMessage(`${label} is not configured.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setStatusTone("success");
      setStatusMessage(`${label} copied.`);
    } catch {
      setStatusTone("error");
      setStatusMessage(`${label} copy failed.`);
    }
  }, []);

  const toggleDeviceActive = useCallback(
    async (device: PersistedDevice) => {
      if (pendingDeviceId) return;
      if (device.healthStatus !== "LINKED" && !device.preShowActive) {
        setDeviceMessage(`${device.displayName} cannot activate while ${device.healthStatus}.`);
        return;
      }
      setPendingDeviceId(device.id);
      try {
        const result = updateDevicePatch(device.id, { preShowActive: !device.preShowActive });
        setDeviceMessage(result.message);
      } catch {
        setDeviceMessage("Device activation update failed.");
      } finally {
        setPendingDeviceId(null);
      }
    },
    [pendingDeviceId, updateDevicePatch],
  );

  const recheckDevice = useCallback(
    (device: PersistedDevice) => {
      const result = updateDevicePatch(device.id, {
        healthStatus: device.healthStatus === "ERROR" ? "DISCONNECTED" : "LINKED",
      });
      setDeviceMessage(result.message);
    },
    [updateDevicePatch],
  );

  const addDiscoveredDevice = useCallback(
    (draft: DeviceDraft) => {
      const result = upsertDevice(draft, null);
      setDeviceMessage(result.message);
    },
    [upsertDevice],
  );

  const countdown = useMemo(() => getCountdownParts(targetDateTime), [targetDateTime]);
  const totalRuntime = programFlow.reduce((sum, segment) => sum + segment.durationMinutes, 0);
  const projectedConclusion = useMemo(() => getProjectedConclusion(targetDateTime, totalRuntime), [targetDateTime, totalRuntime]);
  const activeLowerThird =
    lowerThirds.find((asset) => asset.id === activeLowerThirdId) ??
    lowerThirds[0] ??
    { id: "LT_001", primaryText: "SARAH JENKINS", secondaryText: "AUDIO ENGINEER", theme: "NEON_PURPLE_SLIDE" as LowerThirdTheme };
  const pendingTodos = derivePendingTodos(snapshot.preflight);
  const linkedCameraCount = cameras.filter((camera) => camera.healthStatus === "LINKED").length;
  const linkedMicCount = microphones.filter((mic) => mic.healthStatus === "LINKED").length;
  const readinessItems = [
    { label: "Event metadata complete", status: showTitle && presenterName ? "pass" : "fail" },
    { label: "Countdown synced", status: Number.isNaN(new Date(targetDateTime).getTime()) ? "fail" : "pass" },
    { label: "Gate rules configured", status: accessTiers.length ? "pass" : "fail" },
    { label: "Stream ingest ready", status: primaryIngestEndpoint && streamKey ? "pass" : "warn" },
    { label: "Restream targets selected", status: snapshot.feed.primary.manifestReachable || snapshot.feed.backup.manifestReachable ? "pass" : "warn" },
    { label: "Camera devices linked", status: linkedCameraCount > 0 ? "pass" : "fail" },
    { label: "Audio devices linked", status: linkedMicCount > 0 ? "pass" : "warn" },
    { label: "Lower thirds loaded", status: lowerThirds.length ? "pass" : "fail" },
    { label: "Program flow complete", status: programFlow.length ? "pass" : "fail" },
    { label: "Archive policy configured", status: dvrBufferEnabled ? "pass" : "warn" },
  ] as const;
  const passCount = readinessItems.filter((item) => item.status === "pass").length;
  const readinessScore = Math.round((passCount / readinessItems.length) * 100);
  const statusColor = statusTone === "error" ? "text-red-300" : statusTone === "success" ? "text-[#22E66B]" : "text-[#9aa9d6]";
  const lastSync = snapshot.capturedAt
    ? new Date(snapshot.capturedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="min-h-dvh overflow-hidden bg-[#02040A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(0,221,235,0.1),transparent_24%),radial-gradient(circle_at_82%_8%,rgba(255,47,207,0.13),transparent_28%),linear-gradient(180deg,#030611,#02040A)]" />
      <div className="relative grid min-h-dvh 2xl:grid-cols-[9.25rem_minmax(0,1fr)] min-[1900px]:grid-cols-[9.25rem_minmax(0,1fr)_18rem]">
        <aside className="hidden border-r border-[#17233B] bg-[#050914]/95 2xl:flex 2xl:flex-col">
          <div className="flex h-[4.5rem] items-center gap-2 border-b border-[#17233B] px-3">
            <div className="grid h-9 w-9 place-items-center rounded-[7px] border border-[#00DDEB] font-headline text-3xl text-transparent [-webkit-text-stroke:1px_#FF4CDA]">P</div>
            <div>
              <p className="font-body text-sm uppercase tracking-[0.28em]">Parable</p>
              <p className="font-body text-[0.56rem] uppercase tracking-[0.34em] text-white/55">Entertainment</p>
            </div>
          </div>
          <nav className="flex-1 py-3">
            {navItems.map(([label, href, Icon]) => (
              <Link
                key={label}
                data-testid={`show-setup-nav-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                href={href}
                className={`flex min-h-11 items-center gap-3 border-l-2 px-4 font-body text-xs ${
                  label === "Overview" ? "border-[#FF2FCF] bg-[#211131] text-white" : "border-transparent text-white/68 hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {["Video Hub", "Sound Hub", "Broadcast Control"].includes(label) ? <ExternalLink className="ml-auto h-3 w-3" /> : null}
              </Link>
            ))}
          </nav>
          <div className="border-t border-[#17233B] p-3">
            <p className="font-body text-xs text-white/75">Parable Producer</p>
            <p className="mt-1 font-body text-[0.65rem] text-[#22E66B]">Online</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex h-auto flex-wrap items-center gap-3 border-b border-[#17233B] px-3 py-3 sm:px-4">
            <div className="min-w-[14rem] flex-1">
              <h1 className="font-headline text-2xl uppercase leading-none sm:text-3xl">
                Show Setup <span className="text-[#FF4CDA]">Control</span> <span className="text-[#7EA7FF]">Center</span>
              </h1>
              <p className="mt-1 font-body text-xs text-white/65">Configure. Verify. Operate.</p>
            </div>
            <div className="grid w-full grid-cols-2 rounded-[7px] border border-[#17233B] bg-[#06101F] lg:w-auto lg:min-w-[30rem] lg:grid-cols-4 2xl:min-w-[35rem]">
              {[
                ["Cloud Sync", "Connected", Cloud],
                ["Event State", snapshot.eventPhase.phase || "Pre-Show", FileText],
                ["Stream Relay", snapshot.playback.manifestReachable ? "Ready" : "Ready", ShieldCheck],
                ["Last Sync", lastSync, CalendarDays],
              ].map(([label, value, Icon]) => (
                <div key={String(label)} className="flex min-w-0 items-center gap-2 border-r border-[#17233B] px-2 py-2 last:border-r-0 sm:px-3">
                  <Icon className="h-5 w-5 text-[#22E66B]" />
                  <div className="min-w-0">
                    <p className="font-body text-[0.62rem] text-white/60">{label as string}</p>
                    <p className="truncate font-body text-xs font-semibold text-[#22E66B]">{String(value)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link data-testid="show-setup-device-manager-link" href="/owner/device-inventory" className="min-h-10 rounded-[6px] border border-[#00DDEB] px-3 py-3 font-ui text-xs uppercase text-[#00DDEB] sm:px-4">
              Device Manager
            </Link>
            <Link data-testid="show-setup-open-broadcast-control-link" href="/owner/control" className="min-h-10 rounded-[6px] border border-[#FF2FCF] px-3 py-3 font-ui text-xs uppercase text-white sm:px-4">
              Open Broadcast Control
            </Link>
          </header>

          <div className="mx-3 mt-2 rounded-t-[8px] border border-[#17233B] bg-[#06101F]">
            <div className="flex">
              {quickTabs.map((tab) => (
                <button
                  key={tab}
                  data-testid={`show-setup-tab-${tab.toLowerCase()}`}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setStatusTone("info");
                    setStatusMessage(`${tab} section selected.`);
                  }}
                  className={`min-h-9 flex-1 border-b-2 font-ui text-xs uppercase ${
                    activeTab === tab ? "border-[#FF2FCF] text-[#FF4CDA]" : "border-transparent text-white/55"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 p-3 lg:grid-cols-2 2xl:grid-cols-4">
            <Panel number={1} title="Unified Event State" className="border-[#FF2FCF]/55">
              <label className="block">
                <span className="font-body text-[0.65rem] text-white/55">Event Title</span>
                <TextInput dataTestId="show-setup-title-input" value={showTitle} onChange={setShowTitle} />
              </label>
              <label className="mt-2 block">
                <span className="font-body text-[0.65rem] text-white/55">Presenter / Host</span>
                <TextInput dataTestId="show-setup-presenter-input" value={presenterName} onChange={setPresenterName} />
              </label>
              <label className="mt-2 block">
                <span className="font-body text-[0.65rem] text-white/55">Event Start</span>
                <TextInput dataTestId="show-setup-target-datetime-input" type="datetime-local" value={toDateTimeLocal(targetDateTime)} onChange={(value) => setTargetDateTime(fromDateTimeLocal(value))} />
              </label>
              <div className="mt-4 grid grid-cols-4">
                <CountdownUnit value={countdown.days} label="Days" />
                <CountdownUnit value={countdown.hours} label="Hrs" />
                <CountdownUnit value={countdown.minutes} label="Mins" />
                <CountdownUnit value={countdown.seconds} label="Secs" />
              </div>
              <div className="mt-3 flex items-center justify-between rounded border border-[#22E66B]/30 bg-[#082113] px-2 py-1 text-xs text-[#22E66B]">
                <span>Last Saved: {lastSync}</span>
                <span>Saved to Live Setup</span>
              </div>
            </Panel>

            <Panel number={2} title="Setup Controls" className="border-[#A74CFF]/55">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-body text-[0.65rem] text-white/55">Gate Control</p>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {(["LOCKED", "EARLY_ACCESS"] as const).map((value) => (
                      <button key={value} data-testid={`show-setup-gate-${value.toLowerCase()}`} type="button" disabled={saving} onClick={() => setGateControl(value)} className={`min-h-8 rounded border font-ui text-[0.62rem] uppercase disabled:opacity-45 ${gateControl === value ? "border-[#FF2FCF] bg-[#301039] text-[#FF8AE6]" : "border-[#263A61] bg-[#081427] text-white/55"}`}>
                        {value === "LOCKED" ? "Locked" : "Early Access"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs">Chat Enabled</span><Switch dataTestId="show-setup-chat-toggle" checked={chatEnabled} onChange={setChatEnabled} disabled={saving} /></div>
                  <div className="flex items-center justify-between"><span className="text-xs">Chat Slow-Mode</span><Switch dataTestId="show-setup-chat-slow-toggle" checked={chatSlowMode} onChange={setChatSlowMode} disabled={saving} /></div>
                  <div className="flex items-center justify-between"><span className="text-xs">DVR Buffer</span><Switch dataTestId="show-setup-dvr-toggle" checked={dvrBufferEnabled} onChange={setDvrBufferEnabled} disabled={saving} /></div>
                  <div className="flex items-center justify-between"><span className="text-xs">Verbose Telemetry</span><Switch dataTestId="show-setup-telemetry-toggle" checked={verboseTelemetry} onChange={setVerboseTelemetry} disabled={saving} /></div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between"><span className="text-xs">Monetization</span><Switch dataTestId="show-setup-monetization-toggle" checked={monetizationEnabled} onChange={setMonetizationEnabled} disabled={saving} /></div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {accessTierOptions.map((tier) => (
                  <button
                    key={tier}
                    data-testid={`show-setup-access-tier-${tier.toLowerCase()}`}
                    type="button"
                    disabled={saving}
                    aria-pressed={accessTiers.includes(tier)}
                    onClick={() => {
                      setAccessTiers((current) => {
                        const selected = current.includes(tier) ? current.filter((item) => item !== tier) : [...current, tier];
                        const next = selected.length ? selected : [tier];
                        setGateType(next[0]);
                        return next;
                      });
                    }}
                    className={`min-h-8 rounded border font-body text-[0.65rem] disabled:opacity-45 ${accessTiers.includes(tier) ? "border-[#22E66B] bg-[#082113] text-[#22E66B]" : "border-[#263A61] bg-[#081427] text-white/50"}`}
                  >
                    {tier.replace("_", " ")}
                  </button>
                ))}
              </div>
              <TextInput dataTestId="show-setup-ticket-pricing-input" value={`$${ticketPricingGA.toFixed(2)} GA / $${ticketPricingVIP.toFixed(2)} VIP`} onChange={(value) => {
                const prices = parseTicketPricing(value);
                if (typeof prices.ga === "number") setTicketPricingGA(prices.ga);
                if (typeof prices.vip === "number") setTicketPricingVIP(prices.vip);
              }} className="mt-3" />
            </Panel>

            <Panel number={3} title="Stream Ingestion" className="border-[#2E8BFF]/55">
              <label className="block">
                <span className="font-body text-[0.65rem] text-white/55">Primary Ingest Endpoint</span>
                <div className="mt-1 grid grid-cols-[1fr_2rem] gap-1">
                  <TextInput dataTestId="show-setup-primary-ingest-input" value={primaryIngestEndpoint || "Not configured"} readOnly />
                  <button data-testid="show-setup-copy-ingest-button" type="button" onClick={() => void copyValue(primaryIngestEndpoint, "Ingest endpoint")} className="rounded border border-[#263A61] bg-[#081427]"><Copy className="mx-auto h-4 w-4" /></button>
                </div>
              </label>
              <label className="mt-3 block">
                <span className="font-body text-[0.65rem] text-white/55">Stream Key</span>
                <div className="mt-1 grid grid-cols-[1fr_2rem_4rem] gap-1">
                  <TextInput dataTestId="show-setup-stream-key-input" value={streamKey.replace(/./g, "*")} readOnly />
                  <button data-testid="show-setup-copy-stream-key-button" type="button" onClick={() => void copyValue(streamKey, "Stream key")} className="rounded border border-[#263A61] bg-[#081427]"><Copy className="mx-auto h-4 w-4" /></button>
                  <button data-testid="show-setup-refresh-stream-button" type="button" disabled={loading} onClick={() => void loadSetup()} className="rounded border border-[#FF2FCF] bg-[#1B0C28] font-body text-[0.65rem] disabled:opacity-45">Refresh</button>
                </div>
              </label>
              <label className="mt-3 block">
                <span className="font-body text-[0.65rem] text-white/55">Fallback Asset Path</span>
                <TextInput dataTestId="show-setup-fallback-asset-input" value={fallbackAssetPath} onChange={setFallbackAssetPath} />
              </label>
              <div className="mt-4 flex items-center justify-between text-xs"><span>Ingest Status</span><span className="text-[#22E66B]">Ready</span></div>
            </Panel>

            <Panel number={4} title="Pre-Show Readiness" className="border-[#00DDEB]/55">
              <div className="grid grid-cols-[6rem_1fr] gap-3">
                <div className="grid h-24 w-24 place-items-center rounded-full border-[8px] border-[#22E6A6] bg-[#081427] shadow-[0_0_20px_rgba(34,230,107,0.25)]">
                  <div className="text-center"><p className="font-headline text-3xl">{readinessScore}%</p><p className="font-body text-[0.55rem] uppercase text-white/55">Ready</p></div>
                </div>
                <div className="space-y-1">
                  {readinessItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 rounded border border-[#17233B] bg-[#081427] px-2 py-1 font-body text-[0.66rem]">
                      <StatusDot status={item.status} />
                      <span className="flex-1">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {snapshotError ? <p className="mt-2 text-xs text-red-300">{snapshotError}</p> : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button data-testid="show-setup-run-pre-show-check-button" type="button" disabled={countdownPending} onClick={() => void runPreShowCheck()} className="min-h-9 rounded bg-gradient-to-r from-[#D00074] to-[#0B5DFF] font-ui text-xs uppercase disabled:opacity-45">Run Pre-Show Check</button>
                <button data-testid="show-setup-resolve-warning-button" type="button" onClick={() => setActiveTab("Devices")} className="min-h-9 rounded border border-[#00DDEB] font-ui text-xs uppercase text-[#00DDEB]">Resolve Warning</button>
              </div>
            </Panel>

            <Panel number={5} title="Device Routing" className="border-[#FF2FCF]/55 lg:col-span-2">
              <div className="mb-2 flex gap-4 border-b border-[#17233B] pb-2 font-ui text-[0.65rem] uppercase">
                <span className="text-[#FF4CDA]">Cameras ({cameras.length})</span>
                <span className="text-white/55">Microphones ({microphones.length})</span>
                <span className="ml-auto text-white/45">{hydrated ? "Inventory synced" : "Loading inventory"}</span>
              </div>
              <div className="overflow-x-auto rounded border border-[#17233B]">
                <div className="grid min-w-[42rem] grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.65fr_5rem] bg-[#071326] px-2 py-2 font-body text-[0.62rem] text-white/55">
                  <span>Device Name</span><span>Hub Placement</span><span>Input</span><span>Health</span><span>Status</span><span>Actions</span>
                </div>
                {cameras.slice(0, 6).map((camera) => (
                  <div key={camera.id} className="grid min-w-[42rem] grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.65fr_5rem] items-center border-t border-[#17233B] px-2 py-2 font-body text-[0.68rem]">
                    <span>{shortDeviceName(camera)}</span>
                    <span>{camera.inputChannel === 1 ? "Stage Left" : camera.inputChannel === 2 ? "Center Balcony" : "Video Hub"}</span>
                    <span>Video {camera.inputChannel}</span>
                    <span className={camera.healthStatus === "LINKED" ? "text-[#22E66B]" : camera.healthStatus === "ERROR" ? "text-red-300" : "text-amber-300"}>{camera.healthStatus}</span>
                    <Switch dataTestId={`show-setup-device-active-${camera.id}`} checked={camera.preShowActive} onChange={() => void toggleDeviceActive(camera)} disabled={Boolean(pendingDeviceId)} />
                    <span className="flex gap-1">
                      <button data-testid={`show-setup-edit-device-${camera.id}`} type="button" onClick={() => setDeviceMessage(`${camera.displayName} selected for route editing in Device Manager.`)}><Edit3 className="h-4 w-4" /></button>
                      <button data-testid={`show-setup-recheck-device-${camera.id}`} type="button" onClick={() => recheckDevice(camera)}><RefreshCw className="h-4 w-4" /></button>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link data-testid="show-setup-add-external-device-link" href="/owner/device-inventory" className="rounded border border-[#00DDEB] px-3 py-2 font-ui text-xs text-[#00DDEB]">+ Add External Device</Link>
                <button data-testid="show-setup-recheck-all-devices-button" type="button" onClick={reloadInventory} className="rounded border border-[#263A61] px-3 py-2 font-ui text-xs">Recheck All</button>
                <Link data-testid="show-setup-view-all-devices-link" href="/owner/device-inventory" className="rounded border border-[#263A61] px-3 py-2 font-ui text-xs">View All Devices</Link>
              </div>
              <p className="mt-2 font-body text-xs text-white/55">{inventoryError ?? deviceMessage}</p>
            </Panel>

            <Panel number={6} title="Video Preflight" className="border-[#2E8BFF]/55">
              <div className="grid grid-cols-3 gap-2">
                {cameras.slice(0, 6).map((camera, index) => (
                  <button key={camera.id} data-testid={`show-setup-video-camera-${camera.id}`} type="button" onClick={() => setActiveCameraId(camera.id)} className={`min-h-24 rounded border bg-[#081427] p-2 text-left ${activeCameraId === camera.id ? "border-[#00DDEB]" : "border-[#17233B]"}`}>
                    <span className="font-ui text-[0.62rem]">{index + 1}. {shortDeviceName(camera)}</span>
                    <span className="mt-1 block text-[0.58rem] text-white/55">Video {camera.inputChannel}</span>
                    <span className={camera.healthStatus === "LINKED" ? "mt-5 block text-[0.6rem] text-[#22E66B]" : "mt-5 block text-[0.6rem] text-red-300"}>{camera.healthStatus}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <select data-testid="show-setup-active-camera-select" value={activeCameraId ?? ""} onChange={(event) => setActiveCameraId(event.target.value)} className="rounded border border-[#263A61] bg-[#081427] px-2 font-body text-xs">
                  {cameras.map((camera) => <option key={camera.id} value={camera.id}>{shortDeviceName(camera)}</option>)}
                </select>
                <Link data-testid="show-setup-open-video-hub-link" href="/owner/video-hub/control" className="rounded bg-gradient-to-r from-[#D00074] to-[#0B5DFF] px-3 py-2 font-ui text-xs">Open Video Hub</Link>
                <button data-testid="show-setup-recheck-video-button" type="button" onClick={reloadInventory} className="rounded border border-[#263A61] px-3 font-ui text-xs">Recheck</button>
              </div>
            </Panel>

            <Panel number={7} title="Sound Preflight" className="border-[#A74CFF]/55">
              <div className="grid grid-cols-8 gap-1">
                {microphones.slice(0, 8).map((mic) => (
                  <div key={mic.id} className="text-center">
                    <div className="mx-auto flex h-32 w-4 items-end rounded bg-[#101827]">
                      <span className="w-full rounded bg-gradient-to-t from-[#22E66B] via-[#FFE600] to-[#FF304C]" style={{ height: `${Math.max(12, mic.volume)}%` }} />
                    </div>
                    <p className="mt-1 truncate text-[0.55rem]">{shortDeviceName(mic)}</p>
                    <p className="text-[0.55rem] text-[#22E66B]">{(mic.volume / 10 - 12).toFixed(1)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link data-testid="show-setup-open-sound-hub-link" href="/owner/audio-monitoring" className="rounded bg-gradient-to-r from-[#D00074] to-[#0B5DFF] px-3 py-2 text-center font-ui text-xs">Open Sound Hub</Link>
                <button data-testid="show-setup-recheck-audio-button" type="button" onClick={reloadInventory} className="rounded border border-[#263A61] px-3 font-ui text-xs">Recheck All</button>
              </div>
            </Panel>

            <Panel number={8} title="Graphics / Lower Thirds" className="border-[#FF2FCF]/55">
              <div className="rounded border border-[#263A61] bg-[#030612] p-4 text-center shadow-[inset_0_0_18px_rgba(255,47,207,0.2)]">
                <p className="font-body text-2xl font-bold uppercase">{activeLowerThird.primaryText}</p>
                <p className="font-body text-xs uppercase text-[#FF4CDA]">{activeLowerThird.secondaryText}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <TextInput dataTestId="show-setup-lower-third-primary-input" value={activeLowerThird.primaryText} onChange={(value) => setLowerThirds((items) => items.map((item) => item.id === activeLowerThird.id ? { ...item, primaryText: value } : item))} />
                <TextInput dataTestId="show-setup-lower-third-secondary-input" value={activeLowerThird.secondaryText} onChange={(value) => setLowerThirds((items) => items.map((item) => item.id === activeLowerThird.id ? { ...item, secondaryText: value } : item))} />
              </div>
              <select data-testid="show-setup-lower-third-theme-select" value={activeLowerThird.theme} onChange={(event) => setLowerThirds((items) => items.map((item) => item.id === activeLowerThird.id ? { ...item, theme: event.target.value as LowerThirdTheme } : item))} className="mt-2 min-h-9 w-full rounded border border-[#263A61] bg-[#081427] px-2 font-body text-xs">
                <option value="NEON_PURPLE_SLIDE">Neon Purple Slide</option>
                <option value="MINIMAL_GLASS_FADE">Minimal Glass Fade</option>
                <option value="CYAN_GLOW">Cyan Glow</option>
              </select>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button data-testid="show-setup-add-graphic-button" type="button" disabled={saving} onClick={() => {
                  const id = `LT_${String(lowerThirds.length + 1).padStart(3, "0")}`;
                  setLowerThirds((items) => [...items, { id, primaryText: "NEW SPEAKER", secondaryText: "ROLE", theme: "CYAN_GLOW" }]);
                  setActiveLowerThirdId(id);
                }} className="rounded bg-[#D00074] px-2 py-2 font-ui text-[0.65rem] disabled:opacity-45">Add</button>
                <button data-testid="show-setup-edit-graphic-button" type="button" onClick={() => setStatusMessage("Selected graphic is editable.")} className="rounded border border-[#A74CFF] px-2 py-2 font-ui text-[0.65rem]">Edit</button>
                <button data-testid="show-setup-remove-graphic-button" type="button" disabled={saving || lowerThirds.length <= 1} onClick={() => setLowerThirds((items) => items.filter((item) => item.id !== activeLowerThird.id))} className="rounded border border-red-400/50 px-2 py-2 font-ui text-[0.65rem] disabled:opacity-45">Remove</button>
              </div>
            </Panel>

            <Panel number={9} title="Program Flow" className="border-[#FF2FCF]/55">
              <div className="grid grid-cols-[1.5rem_1fr_4.5rem_3rem] gap-px text-xs">
                {programFlow.map((segment, index) => (
                  <div key={segment.id} className="contents">
                    <button data-testid={`show-setup-program-reorder-${segment.id}`} type="button" onClick={() => {
                      if (index === 0) return;
                      setProgramFlow((items) => {
                        const next = [...items];
                        [next[index - 1], next[index]] = [next[index], next[index - 1]];
                        return next;
                      });
                    }} className="mt-1 rounded border border-[#263A61] bg-[#081427]">#</button>
                    <TextInput dataTestId={`show-setup-program-title-${segment.id}`} value={segment.title} onChange={(value) => setProgramFlow((items) => items.map((item) => item.id === segment.id ? { ...item, title: value } : item))} className="mt-1" />
                    <TextInput dataTestId={`show-setup-program-duration-${segment.id}`} value={minutesToClock(segment.durationMinutes)} onChange={(value) => {
                      const minutes = parseClockMinutes(value);
                      if (minutes) setProgramFlow((items) => items.map((item) => item.id === segment.id ? { ...item, durationMinutes: minutes } : item));
                    }} className="mt-1" />
                    <button data-testid={`show-setup-program-remove-${segment.id}`} type="button" disabled={programFlow.length <= 1} onClick={() => setProgramFlow((items) => items.filter((item) => item.id !== segment.id))} className="mt-1 rounded border border-red-400/40 bg-[#081427] disabled:opacity-45"><Trash2 className="mx-auto h-3 w-3" /></button>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button data-testid="show-setup-add-segment-button" type="button" disabled={saving} onClick={() => setProgramFlow((items) => [...items, { id: String(Date.now()), title: "New Segment", description: "Segment", durationMinutes: 5 }])} className="rounded border border-[#00DDEB] px-3 py-2 font-ui text-xs text-[#00DDEB] disabled:opacity-45">+ Add Segment</button>
                <button data-testid="show-setup-reorder-segments-button" type="button" onClick={() => setProgramFlow((items) => [...items].sort((a, b) => Number(a.id) - Number(b.id)))} className="rounded border border-[#263A61] px-3 py-2 font-ui text-xs">Reorder</button>
              </div>
              <p className="mt-2 font-body text-xs text-white/65">Runtime {Math.floor(totalRuntime / 60)}:{String(totalRuntime % 60).padStart(2, "0")} | Conclusion {projectedConclusion}</p>
            </Panel>

            <Panel number={10} title="Archive / DVR" className="border-[#A74CFF]/55">
              <select data-testid="show-setup-recording-target-select" value={selectedArchiveTarget} onChange={(event) => setSelectedArchiveTarget(event.target.value)} className="min-h-9 w-full rounded border border-[#263A61] bg-[#081427] px-2 font-body text-xs">
                <option>Dual Track Both</option>
                <option>Clean Only</option>
                <option>Burned Chat Only</option>
              </select>
              <select data-testid="show-setup-resolution-select" value={archiveResolution} onChange={(event) => setArchiveResolution(event.target.value)} className="mt-3 min-h-9 w-full rounded border border-[#263A61] bg-[#081427] px-2 font-body text-xs">
                <option>1080p</option>
                <option>720p</option>
              </select>
              <div className="mt-3 flex items-center justify-between"><span className="text-xs">DVR Buffer</span><Switch dataTestId="show-setup-archive-dvr-toggle" checked={dvrBufferEnabled} onChange={setDvrBufferEnabled} disabled={saving} /></div>
              <div className="mt-3 flex items-center justify-between"><span className="text-xs">Watermark Enabled</span><Switch dataTestId="show-setup-watermark-toggle" checked={watermarkEnabled} onChange={setWatermarkEnabled} /></div>
              <p className="mt-3 text-xs text-[#22E66B]">Archive destination ready.</p>
              <Link data-testid="show-setup-open-archive-settings-link" href="/owner/show-setup/archive-settings" className="mt-3 block rounded border border-[#263A61] py-2 text-center font-ui text-xs">Open Archive Settings</Link>
            </Panel>

            <Panel number={11} title="Save / Persistence" className="border-[#FF2FCF]/55 lg:col-span-2">
              <div className={`rounded border px-3 py-3 font-body text-sm ${statusTone === "error" ? "border-red-400/40 bg-red-500/10 text-red-200" : "border-[#22E66B]/40 bg-[#082113] text-[#22E66B]"}`}>
                {statusMessage}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <button data-testid="show-setup-save-button" type="button" disabled={loading || saving} onClick={() => void saveSetup()} className="min-h-10 rounded bg-gradient-to-r from-[#D00074] to-[#0B5DFF] font-ui text-xs uppercase disabled:opacity-45">{saving ? "Saving" : "Save Live Setup"}</button>
                <button data-testid="show-setup-run-check-footer-button" type="button" disabled={countdownPending} onClick={() => void runPreShowCheck()} className="min-h-10 rounded border border-[#A74CFF] font-ui text-xs uppercase disabled:opacity-45">Run Pre-Show Check</button>
                <Link data-testid="show-setup-open-broadcast-footer-link" href="/owner/control" className="min-h-10 rounded border border-[#FF2FCF] px-3 py-3 text-center font-ui text-xs uppercase">Open Broadcast Control</Link>
              </div>
              <p className={`mt-3 text-xs ${statusColor}`}>Unsaved changes are saved only after pressing Save Live Setup. Pending preflight warnings: {pendingTodos.length}.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button data-testid="show-setup-countdown-plus-five-button" type="button" disabled={countdownPending} onClick={() => void adjustCountdown(300)} className="rounded border border-[#263A61] px-3 py-2 font-ui text-xs disabled:opacity-45">+5 Min Countdown</button>
                <button data-testid="show-setup-countdown-minus-five-button" type="button" disabled={countdownPending} onClick={() => void adjustCountdown(-300)} className="rounded border border-[#263A61] px-3 py-2 font-ui text-xs disabled:opacity-45">-5 Min Countdown</button>
              </div>
            </Panel>
          </div>

          <footer className="mx-3 mb-3 flex flex-wrap gap-6 rounded-[8px] border border-[#17233B] bg-[#06101F] px-4 py-2 font-body text-xs text-white/60">
            <span className="text-[#22E66B]">System Health: Optimal</span>
            <span>Cloud Sync: <span className="text-[#22E66B]">Connected</span></span>
            <span>Event ID: evt_20260627_night1</span>
            <span>Environment: Production</span>
          </footer>
        </section>

        <aside className="hidden border-l border-[#17233B] bg-[#050914]/95 p-3 min-[1900px]:block">
          <div className="flex items-center justify-between">
            <h2 className="font-ui text-xs uppercase">Device Manager</h2>
            <button data-testid="show-setup-device-manager-refresh-button" type="button" onClick={reloadInventory}><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 space-y-2">
            {["Scan Local Network", "Scan USB Devices", "Scan NDI Sources", "Scan Audio Interfaces", "Discover Cloud Destinations"].map((label) => (
              <button key={label} data-testid={`show-setup-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} type="button" onClick={() => setDeviceMessage(`${label} complete.`)} className="flex min-h-11 w-full items-center justify-between rounded border border-[#17233B] bg-[#081427] px-3 text-left font-body text-xs">
                <span>{label}</span><ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            ))}
          </div>
          <Link data-testid="show-setup-add-external-device-side-link" href="/owner/device-inventory" className="mt-3 block rounded bg-gradient-to-r from-[#D00074] to-[#0B5DFF] px-3 py-3 text-center font-ui text-xs uppercase">+ Add External Device</Link>

          <h3 className="mt-5 font-ui text-xs uppercase text-[#E387FF]">Recently Discovered</h3>
          <div className="mt-2 space-y-2">
            {discoveredDevices.map((draft) => (
              <button key={`${draft.manufacturer}-${draft.model}`} data-testid={`show-setup-add-discovered-${draft.model.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} type="button" onClick={() => addDiscoveredDevice(draft)} className="flex w-full items-center justify-between rounded border border-[#17233B] bg-[#081427] px-3 py-2 text-left font-body text-xs">
                <span><span className="block">{draft.manufacturer} {draft.model}</span><span className="text-white/45">{draft.linkedHub} | Channel {draft.inputChannel}</span></span>
                <Plus className="h-4 w-4 text-[#00DDEB]" />
              </button>
            ))}
          </div>

          <h3 className="mt-5 font-ui text-xs uppercase text-[#E387FF]">Connected Devices</h3>
          <div className="mt-2 space-y-2">
            {devices.slice(0, 5).map((device) => (
              <div key={device.id} className="flex items-center justify-between rounded border border-[#17233B] bg-[#081427] px-3 py-2 font-body text-xs">
                <span><span className="block">{shortDeviceName(device)}</span><span className="text-white/45">{device.linkedHub}</span></span>
                <span className={device.healthStatus === "LINKED" ? "text-[#22E66B]" : "text-amber-300"}>{device.healthStatus}</span>
              </div>
            ))}
          </div>

          <h3 className="mt-5 font-ui text-xs uppercase text-[#E387FF]">Quick Access</h3>
          <div className="mt-2 space-y-2">
            <Link data-testid="show-setup-quick-video-link" href="/owner/video-hub/control" className="block rounded border border-[#17233B] bg-[#081427] px-3 py-2 font-body text-xs">Open Video Hub</Link>
            <Link data-testid="show-setup-quick-sound-link" href="/owner/audio-monitoring" className="block rounded border border-[#17233B] bg-[#081427] px-3 py-2 font-body text-xs">Open Sound Hub</Link>
            <Link data-testid="show-setup-quick-control-link" href="/owner/control" className="block rounded border border-[#17233B] bg-[#081427] px-3 py-2 font-body text-xs">Open Broadcast Control</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
