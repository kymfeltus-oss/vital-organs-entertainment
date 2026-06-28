"use client";

import { useCallback, useEffect, useState } from "react";
import AudioMixingDesk from "@/components/owner/AudioMixingDesk";
import {
  DEFAULT_OWNER_AUDIO_CONFIG,
  type OwnerAudioConfig,
} from "@/lib/owner/audio-contracts";

type AudioPresetsResponse = {
  ok?: boolean;
  config?: OwnerAudioConfig;
  error?: string;
  message?: string;
};

export default function OwnerMasteringDeskClient() {
  const [config, setConfig] = useState<OwnerAudioConfig>(DEFAULT_OWNER_AUDIO_CONFIG);
  const [loading, setLoading] = useState(true);
  const [configPending, setConfigPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/owner/audio/presets", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        setError("Owner access denied.");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load mastering desk presets.");
      }

      const data = (await response.json()) as AudioPresetsResponse;
      if (data.config) setConfig(data.config);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleConfigChange = useCallback(async (patch: Partial<OwnerAudioConfig>) => {
    setConfigPending(true);
    setActionMessage(null);

    const nextConfig = { ...config, ...patch };

    try {
      const response = await fetch("/api/owner/audio/presets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: nextConfig }),
      });
      const data = (await response.json()) as AudioPresetsResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Master FX update failed.");
      }

      if (data.config) setConfig(data.config);
      setActionMessage(data.message ?? "Master FX presets committed to live session.");
    } catch (patchError) {
      setActionMessage(
        patchError instanceof Error ? patchError.message : "Master FX update failed.",
      );
    } finally {
      setConfigPending(false);
    }
  }, [config]);

  if (loading) {
    return (
      <p className="p-6 font-body text-sm text-slate-500">Loading mastering desk…</p>
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
      <AudioMixingDesk
        config={config}
        configPending={configPending}
        onConfigChange={(patch) => void handleConfigChange(patch)}
      />
    </div>
  );
}
