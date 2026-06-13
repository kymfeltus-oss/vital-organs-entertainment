"use client";

import { Settings, X } from "lucide-react";
import LiveHubNetworkSettingsPanel from "@/components/live-hub/LiveHubNetworkSettingsPanel";
import type { LiveHubNetworkSettings } from "@/lib/live-hub/network-settings";
import type { NetworkTelemetry } from "@/lib/live-hub/network";

type LiveHubNetworkSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  settings: LiveHubNetworkSettings;
  onChange: (patch: Partial<LiveHubNetworkSettings>) => void;
  telemetry: NetworkTelemetry;
  networkOnline: boolean;
  onTestConnection: () => void | Promise<void>;
  isTesting?: boolean;
};

export default function LiveHubNetworkSettingsModal({
  open,
  onClose,
  settings,
  onChange,
  telemetry,
  networkOnline,
  onTestConnection,
  isTesting = false,
}: LiveHubNetworkSettingsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="network-settings-title"
    >
      <div className="flex max-h-[min(92dvh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-panel shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-brand-blue" aria-hidden="true" />
            <h2
              id="network-settings-title"
              className="font-headline text-fluid-section uppercase tracking-widest text-white"
            >
              Network &amp; Connectivity
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:text-white"
            aria-label="Close network settings"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <LiveHubNetworkSettingsPanel
            settings={settings}
            onChange={onChange}
            telemetry={telemetry}
            networkOnline={networkOnline}
            onTestConnection={onTestConnection}
            isTesting={isTesting}
            compact
          />
        </div>
      </div>
    </div>
  );
}
