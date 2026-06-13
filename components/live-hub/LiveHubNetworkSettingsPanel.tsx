"use client";

import {
  Cable,
  Copy,
  ExternalLink,
  RefreshCw,
  Wifi,
} from "lucide-react";
import {
  buildVmixWebControllerUrl,
  connectionPreferenceLabel,
  NETWORK_PROBE_INTERVAL_OPTIONS,
  openWindowsNetworkSettings,
  sanitizeLanHost,
  type LiveHubNetworkSettings,
  type NetworkConnectionPreference,
} from "@/lib/live-hub/network-settings";
import {
  formatInternetDetail,
  type NetworkTelemetry,
} from "@/lib/live-hub/network";

type LiveHubNetworkSettingsPanelProps = {
  settings: LiveHubNetworkSettings;
  onChange: (patch: Partial<LiveHubNetworkSettings>) => void;
  telemetry: NetworkTelemetry;
  networkOnline: boolean;
  onTestConnection: () => void | Promise<void>;
  isTesting?: boolean;
  compact?: boolean;
};

function PreferenceOption({
  id,
  name,
  checked,
  onChange,
  label,
  detail,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  detail: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition ${
        checked
          ? "border-brand-blue/45 bg-brand-blue/10"
          : "border-white/8 bg-brand-black/80 hover:border-white/15"
      }`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0 accent-brand-blue"
      />
      <span className="min-w-0">
        <span className="block text-[0.58rem] font-bold uppercase tracking-[0.1em] text-zinc-200">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-brand-muted">{detail}</span>
      </span>
    </label>
  );
}

export default function LiveHubNetworkSettingsPanel({
  settings,
  onChange,
  telemetry,
  networkOnline,
  onTestConnection,
  isTesting = false,
  compact = false,
}: LiveHubNetworkSettingsPanelProps) {
  const vmixUrl = buildVmixWebControllerUrl(settings.vmixLanHost);
  const telemetryDetail = telemetry.lastProbedAt
    ? formatInternetDetail(telemetry)
    : "No probe yet — run a connection test";

  const copyVmixUrl = async () => {
    if (!vmixUrl) return;
    await navigator.clipboard?.writeText(vmixUrl);
  };

  const setPreference = (connectionPreference: NetworkConnectionPreference) => {
    onChange({ connectionPreference });
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="rounded-xl border border-white/8 bg-brand-black/80 px-3 py-3">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
          Live status
        </p>
        <p
          className={`mt-2 text-sm ${
            networkOnline ? "text-brand-blue" : "text-brand-pink"
          }`}
        >
          {telemetryDetail}
        </p>
        <p className="mt-2 text-xs text-brand-muted">
          Browsers cannot switch Wi‑Fi networks for you — use the buttons below to open
          Windows network settings, then re-test.
        </p>
      </div>

      <div>
        <h4 className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-zinc-400">
          Connection preference
        </h4>
        <div className="mt-3 space-y-2">
          {(
            [
              {
                value: "auto" as const,
                detail: "Accept Ethernet or Wi‑Fi when probe passes.",
              },
              {
                value: "ethernet" as const,
                detail: "Warn when the encoder PC is on Wi‑Fi — plug in CAT6 (Phase IX).",
              },
              {
                value: "wifi" as const,
                detail: "Label control tablets; encoder should still use Ethernet when possible.",
              },
            ] as const
          ).map((option) => (
            <PreferenceOption
              key={option.value}
              id={`network-pref-${option.value}`}
              name="network-preference"
              checked={settings.connectionPreference === option.value}
              onChange={() => setPreference(option.value)}
              label={connectionPreferenceLabel(option.value)}
              detail={option.detail}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-zinc-400">
            Broadcast Wi‑Fi SSID
          </span>
          <input
            type="text"
            value={settings.broadcastWifiSsid}
            onChange={(event) =>
              onChange({ broadcastWifiSsid: event.target.value.slice(0, 64) })
            }
            placeholder="e.g. Broadcast_5GHz"
            className="mt-2 w-full rounded-xl border border-white/10 bg-brand-black px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-blue/50 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-brand-muted">
            Phase X: phones/tablets must join this SSID (not guest Wi‑Fi).
          </span>
        </label>

        <label className="block">
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-zinc-400">
            vMix LAN host (IPv4)
          </span>
          <input
            type="text"
            value={settings.vmixLanHost}
            onChange={(event) =>
              onChange({ vmixLanHost: sanitizeLanHost(event.target.value) })
            }
            placeholder="192.168.1.15"
            className="mt-2 w-full rounded-xl border border-white/10 bg-brand-black px-3 py-2.5 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-brand-blue/50 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-brand-muted">
            From ipconfig or vMix → Settings → Web Controller.
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-zinc-400">
            Probe interval
          </span>
          <select
            value={settings.probeIntervalSec}
            onChange={(event) =>
              onChange({ probeIntervalSec: Number(event.target.value) })
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-brand-black px-3 py-2.5 text-sm text-white focus:border-brand-blue/50 focus:outline-none"
          >
            {NETWORK_PROBE_INTERVAL_OPTIONS.map((seconds) => (
              <option key={seconds} value={seconds}>
                Every {seconds} seconds
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-white/8 bg-brand-black/80 px-3 py-3">
          <input
            type="checkbox"
            checked={settings.requireServerProbe}
            onChange={(event) => onChange({ requireServerProbe: event.target.checked })}
            className="mt-1 h-4 w-4 accent-brand-blue"
          />
          <span>
            <span className="block text-[0.58rem] font-bold uppercase tracking-[0.1em] text-zinc-200">
              Require server probe
            </span>
            <span className="mt-1 block text-xs text-brand-muted">
              Fail-closed: navigator.onLine alone is not enough for Ready.
            </span>
          </span>
        </label>
      </div>

      <div>
        <h4 className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-zinc-400">
          Open Windows settings
        </h4>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openWindowsNetworkSettings("wifi")}
            className="inline-flex touch-target items-center gap-2 rounded-xl border border-white/10 bg-brand-black/80 px-3 py-2.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-zinc-300 transition hover:border-brand-blue/40 hover:text-white"
          >
            <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
            Wi‑Fi networks
          </button>
          <button
            type="button"
            onClick={() => openWindowsNetworkSettings("ethernet")}
            className="inline-flex touch-target items-center gap-2 rounded-xl border border-white/10 bg-brand-black/80 px-3 py-2.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-zinc-300 transition hover:border-brand-blue/40 hover:text-white"
          >
            <Cable className="h-3.5 w-3.5" aria-hidden="true" />
            Ethernet
          </button>
          <button
            type="button"
            onClick={() => openWindowsNetworkSettings("networkStatus")}
            className="inline-flex touch-target items-center gap-2 rounded-xl border border-white/10 bg-brand-black/80 px-3 py-2.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-zinc-300 transition hover:border-brand-blue/40 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Network status
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onTestConnection()}
          disabled={isTesting}
          className="inline-flex touch-target items-center gap-2 rounded-xl border border-brand-blue/40 bg-brand-blue/10 px-4 py-2.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-white transition enabled:hover:border-brand-blue/60 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {isTesting ? "Testing…" : "Test connection"}
        </button>
        {vmixUrl ? (
          <>
            <a
              href={vmixUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex touch-target items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:border-brand-blue/40 hover:text-white"
            >
              Open vMix :8088
            </a>
            <button
              type="button"
              onClick={() => void copyVmixUrl()}
              className="inline-flex touch-target items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:border-brand-blue/40 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy LAN URL
            </button>
          </>
        ) : null}
      </div>

      {!compact ? (
        <details className="rounded-xl border border-white/8 bg-brand-black/60 px-3 py-2">
          <summary className="cursor-pointer py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-zinc-400">
            Phase IX · Ethernet priority (runbook)
          </summary>
          <ol className="list-decimal space-y-2 pb-3 pl-5 text-xs leading-relaxed text-brand-muted">
            <li>Connect CAT6 from router LAN → PC RJ45.</li>
            <li>
              In PowerShell (Admin): Set-NetIPInterface -InterfaceAlias &quot;Ethernet&quot;
              -InterfaceMetric 1
            </li>
            <li>Prefer 5 GHz for control tablets — distinct SSID from 2.4 GHz.</li>
          </ol>
        </details>
      ) : null}
    </div>
  );
}
