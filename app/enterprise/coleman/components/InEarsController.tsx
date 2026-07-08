"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchRoutingConfig, saveRoutingConfig } from "@/app/enterprise/coleman/lib/api-client";
import { useStageAudioRouting } from "@/app/enterprise/coleman/lib/hooks/useStageAudioRouting";
import type {
  AudioRoutingConfigRecord,
  RoutingInputSource,
  RoutingSelectedMode,
} from "@/app/enterprise/coleman/lib/routing-persistence";
import { getRoutingUserId } from "@/app/enterprise/coleman/lib/routing-user-id";

type RoutingDraft = {
  selectedMode: RoutingSelectedMode;
  inputSource: RoutingInputSource;
  noiseGateDb: number;
  latencyOffsetMs: number;
};

const INPUT_OPTIONS: Array<{ type: RoutingInputSource; label: string; icon: string }> = [
  { type: "ACOUSTIC_AIR", label: "Internal Room Mic", icon: "🎤" },
  { type: "DIRECT_LINE", label: "Audio Interface Line", icon: "🔌" },
  { type: "WIFI_STREAM", label: "Digital Wi-Fi Console", icon: "📶" },
];

function toDraft(record: AudioRoutingConfigRecord): RoutingDraft {
  return {
    selectedMode: record.selectedMode,
    inputSource: record.inputSource,
    noiseGateDb: record.noiseGateDb,
    latencyOffsetMs: record.latencyOffsetMs,
  };
}

export default function InEarsController({ active = true }: { active?: boolean }) {
  const userId = useMemo(() => getRoutingUserId(), []);
  const { routingBusy, routingError, applyPersistedRoutingConfig, clearRoutingError } =
    useStageAudioRouting();

  const [config, setConfig] = useState<RoutingDraft>({
    selectedMode: "SPEAKER",
    inputSource: "ACOUSTIC_AIR",
    noiseGateDb: -45,
    latencyOffsetMs: 0,
  });
  const [isSyncing, setIsSyncing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  const applyHardware = useCallback(
    async (record: AudioRoutingConfigRecord) => {
      await applyPersistedRoutingConfig({
        selectedMode: record.selectedMode,
        inputSource: record.inputSource,
        noiseGateDb: record.noiseGateDb,
        lowPassCutoffHz: record.lowPassCutoffHz,
        latencyOffsetMs: record.latencyOffsetMs,
      });
    },
    [applyPersistedRoutingConfig],
  );

  const fetchLiveRoutingState = useCallback(async () => {
    try {
      setIsSyncing(true);
      setErrorMessage(null);
      const currentData = await fetchRoutingConfig(userId);
      setConfig(toDraft(currentData));
      await applyHardware(currentData);
    } catch {
      setErrorMessage("Unable to connect with target hardware configuration profiles.");
    } finally {
      setIsSyncing(false);
    }
  }, [applyHardware, userId]);

  useEffect(() => {
    if (!active) {
      return;
    }
    void fetchLiveRoutingState();
  }, [active, fetchLiveRoutingState]);

  const persistStateUpdate = useCallback(
    async (updatedFields: Partial<RoutingDraft>) => {
      const speculativePayload = { ...config, ...updatedFields };

      try {
        setErrorMessage(null);
        setSuccessNotice(false);
        clearRoutingError();

        const confirmedData = await saveRoutingConfig({
          userId,
          ...speculativePayload,
        });

        setConfig(toDraft(confirmedData));
        await applyHardware(confirmedData);
        setSuccessNotice(true);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Network submission fault generated.",
        );
      }
    },
    [applyHardware, clearRoutingError, config, userId],
  );

  const statusLabel =
    config.inputSource !== "ACOUSTIC_AIR"
      ? "🔒 DIRECT LINE SECURED"
      : "🎤 INT. MIC GATE ACTIVE";

  return (
    <div className="coleman-in-ears">
      <div className="coleman-in-ears__header">
        <div>
          <span className="coleman-label !text-[9px]">STAGE MONITORING ENGINE</span>
          <h2 className="coleman-heading mt-1 text-lg font-bold tracking-tight">
            In-Ears Calibration
          </h2>
        </div>
        <div
          className={`coleman-in-ears__status ${
            config.inputSource !== "ACOUSTIC_AIR" ? "is-direct" : ""
          }`}
        >
          {statusLabel}
        </div>
      </div>

      {errorMessage ? (
        <div className="coleman-in-ears__alert coleman-in-ears__alert--error" role="alert">
          ⚠️ {errorMessage}
        </div>
      ) : null}

      {routingError ? (
        <div className="coleman-in-ears__alert coleman-in-ears__alert--error" role="alert">
          ⚠️ {routingError}
        </div>
      ) : null}

      {successNotice ? (
        <div className="coleman-in-ears__alert coleman-in-ears__alert--success" role="status">
          ✨ Audio hardware channels synced and locked.
        </div>
      ) : null}

      {isSyncing ? (
        <div className="coleman-in-ears__loading" aria-busy="true">
          <div className="coleman-in-ears__spinner" />
        </div>
      ) : (
        <div className="coleman-in-ears__body">
          <div>
            <label className="coleman-label mb-2 block !text-[9px]">
              Output Direct Routing Destination
            </label>
            <div className="coleman-in-ears__toggle">
              <button
                type="button"
                disabled={routingBusy}
                onClick={() => void persistStateUpdate({ selectedMode: "SPEAKER" })}
                className={`coleman-in-ears__chip ${
                  config.selectedMode === "SPEAKER" ? "is-active" : ""
                }`}
              >
                <span>🔊</span> <span>Phone Speaker</span>
              </button>
              <button
                type="button"
                disabled={routingBusy}
                onClick={() => void persistStateUpdate({ selectedMode: "HEADPHONES" })}
                className={`coleman-in-ears__chip ${
                  config.selectedMode === "HEADPHONES" ? "is-active" : ""
                }`}
              >
                <span>🎧</span> <span>In-Ear Monitors</span>
              </button>
            </div>
          </div>

          <div>
            <label className="coleman-label mb-2 block !text-[9px]">Isolated Capture Vector</label>
            <div className="coleman-in-ears__sources">
              {INPUT_OPTIONS.map((src) => (
                <button
                  key={src.type}
                  type="button"
                  disabled={routingBusy}
                  onClick={() => void persistStateUpdate({ inputSource: src.type })}
                  className={`coleman-in-ears__pill ${
                    config.inputSource === src.type ? "is-active" : ""
                  }`}
                >
                  <span>{src.icon}</span> <span>{src.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="coleman-in-ears__sliders">
            <div>
              <div className="coleman-in-ears__slider-head">
                <label className="coleman-label !text-[9px]">Noise Gate Threshold</label>
                <span className="coleman-heading text-xs font-bold">{config.noiseGateDb} dB</span>
              </div>
              <input
                type="range"
                min="-100"
                max="0"
                step="5"
                value={config.noiseGateDb}
                disabled={routingBusy}
                onChange={(event) => {
                  setConfig((prev) => ({
                    ...prev,
                    noiseGateDb: parseFloat(event.target.value),
                  }));
                }}
                onMouseUp={(event) => {
                  const value = parseFloat((event.target as HTMLInputElement).value);
                  void persistStateUpdate({ noiseGateDb: value });
                }}
                onTouchEnd={(event) => {
                  const value = parseFloat((event.target as HTMLInputElement).value);
                  void persistStateUpdate({ noiseGateDb: value });
                }}
                className="coleman-in-ears__range"
              />
            </div>

            <div>
              <div className="coleman-in-ears__slider-head">
                <label className="coleman-label !text-[9px]">Wireless Latency Compensation</label>
                <span className="coleman-heading text-xs font-bold">
                  {config.latencyOffsetMs} ms
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={config.latencyOffsetMs}
                disabled={routingBusy}
                onChange={(event) => {
                  setConfig((prev) => ({
                    ...prev,
                    latencyOffsetMs: parseInt(event.target.value, 10),
                  }));
                }}
                onMouseUp={(event) => {
                  const value = parseInt((event.target as HTMLInputElement).value, 10);
                  void persistStateUpdate({ latencyOffsetMs: value });
                }}
                onTouchEnd={(event) => {
                  const value = parseInt((event.target as HTMLInputElement).value, 10);
                  void persistStateUpdate({ latencyOffsetMs: value });
                }}
                className="coleman-in-ears__range"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
