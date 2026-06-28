"use client";

import { useCallback, useEffect, useState } from "react";
import AudioMonitoring from "@/components/owner/AudioMonitoring";
import {
  DEFAULT_OWNER_AUDIO_CONFIG,
  type OwnerAudioConfig,
  type OwnerAudioTelemetry,
} from "@/lib/owner/audio-contracts";

type AudioConfigResponse = {
  ok?: boolean;
  config?: OwnerAudioConfig;
  telemetry?: OwnerAudioTelemetry;
  error?: string;
  message?: string;
};

export default function OwnerAudioMonitoringClient() {
  const [config, setConfig] = useState<OwnerAudioConfig>(DEFAULT_OWNER_AUDIO_CONFIG);
  const [telemetry, setTelemetry] = useState<OwnerAudioTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [configPending, setConfigPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAudioState = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/owner/audio/config", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        setError("Owner access denied.");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load audio telemetry.");
      }

      const data = (await response.json()) as AudioConfigResponse;
      if (data.config) setConfig(data.config);
      if (data.telemetry) setTelemetry(data.telemetry);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAudioState();
    const intervalId = window.setInterval(() => void loadAudioState(true), 4_000);
    return () => window.clearInterval(intervalId);
  }, [loadAudioState]);

  const postConfigPatch = useCallback(async (patch: Partial<OwnerAudioConfig>) => {
    setConfigPending(true);
    setActionMessage(null);
    try {
      const response = await fetch("/api/owner/audio/config", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await response.json()) as AudioConfigResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Audio config update failed.");
      }

      if (data.config) setConfig(data.config);
      if (data.telemetry) setTelemetry(data.telemetry);
      setActionMessage(data.message ?? "Configuration updated.");
    } catch (patchError) {
      setActionMessage(
        patchError instanceof Error ? patchError.message : "Audio config update failed.",
      );
    } finally {
      setConfigPending(false);
    }
  }, []);

  if (loading && !telemetry) {
    return (
      <p className="p-6 font-body text-sm text-slate-500">Loading sound control telemetry…</p>
    );
  }

  return (
    <div>
      {error ? (
        <div className="mx-4 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-sm text-red-200 sm:mx-6">
          {error}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="mx-4 mt-4 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 font-body text-sm text-slate-200 sm:mx-6">
          {actionMessage}
        </div>
      ) : null}
      <AudioMonitoring
        tracks={telemetry?.tracks ?? []}
        aiGainGuardEnabled={config.aiGainGuardEnabled}
        mediaNodeStatus={telemetry?.mediaNodeStatus}
        mediaNodeDetail={telemetry?.mediaNodeDetail}
        configPending={configPending}
        onToggleAiGainGuard={(enabled) => void postConfigPatch({ aiGainGuardEnabled: enabled })}
      />
    </div>
  );
}
