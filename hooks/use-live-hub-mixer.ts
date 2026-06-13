import { useCallback, useEffect, useRef, useState } from "react";

type WorkerCommand = {
  target: string;
  action: string;
  reason: string;
};

type AudioMixerState = {
  masterVolumeLevel: number;
  isStripeReady: boolean;
  healingLogs: string[];
};

type UseLiveHubMixerResult = {
  masterVolumeLevel: number;
  healingLogs: string[];
  /** Dev-only: inject 3s of zero audio telemetry to exercise self-healing logs. */
  simulateAudioDrop?: () => void;
};

/**
 * Production-grade Web Audio API & worker link for the operator console.
 * Captures local hardware audio, runs analyser telemetry, and coordinates
 * with `/workers/audio-mixer-worker.js` for self-healing signals.
 */
export function useLiveHubMixer(isDevSandbox: boolean): UseLiveHubMixerResult {

  const [mixerState, setMixerState] = useState<AudioMixerState>({
    masterVolumeLevel: 0,
    isStripeReady: false,
    healingLogs: ["Initializing Background Web Worker Engine..."],
  });

  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const forceSilenceRef = useRef(false);

  const logEvent = useCallback((msg: string) => {
    setMixerState((prev) => ({
      ...prev,
      healingLogs: [msg, ...prev.healingLogs.slice(0, 10)],
    }));
  }, []);

  const simulateAudioDrop = useCallback(() => {
    if (!isDevSandbox || !workerRef.current) return;

    logEvent("DEBUG: Injecting 3s silence simulation…");
    forceSilenceRef.current = true;

    let ticks = 0;
    const intervalId = window.setInterval(() => {
      workerRef.current?.postMessage({
        type: "PROCESS_METRICS",
        payload: {
          masterVolumeLevel: 0,
          isContextSuspended: false,
          timestamp: Date.now(),
        },
      });
      ticks += 1;
      if (ticks >= 7) {
        window.clearInterval(intervalId);
        forceSilenceRef.current = false;
      }
    }, 500);
  }, [isDevSandbox, logEvent]);

  useEffect(() => {
    workerRef.current = new Worker("/workers/audio-mixer-worker.js");
    workerRef.current.postMessage({ type: "INITIALIZE_ENGINE" });

    const setupAudioHardware = async () => {
      try {
        const AudioContextClass =
          window.AudioContext ??
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;

        if (!AudioContextClass) {
          logEvent("Web Audio API is not available in this browser.");
          return;
        }

        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 32;

        // Silent analysis path only — never route mic back to speakers (feedback).
        source.connect(analyser);

        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        logEvent("Live hardware audio context successfully mapped.");
      } catch {
        logEvent("Audio input permission denied or device unavailable.");
      }
    };

    void setupAudioHardware();

    workerRef.current.onmessage = (event: MessageEvent) => {
      const { type, commands, payload } = event.data as {
        type: string;
        commands?: WorkerCommand[];
        payload?: { masterLevel?: number };
      };

      if (type === "REQUEST_FRESH_METRICS") {
        let dynamicVolume = 0;

        if (!forceSilenceRef.current && analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          const totalSignal = dataArrayRef.current.reduce((acc, val) => acc + val, 0);
          dynamicVolume = totalSignal / dataArrayRef.current.length / 255;
        }

        workerRef.current?.postMessage({
          type: "PROCESS_METRICS",
          payload: {
            masterVolumeLevel: dynamicVolume,
            isContextSuspended: audioContextRef.current?.state === "suspended",
            timestamp: Date.now(),
          },
        });
      }

      if (type === "EXECUTE_SELF_HEALING" && commands) {
        for (const cmd of commands) {
          logEvent(
            `🔧 [Self-Heal] ${cmd.reason} -> Execution Target: ${cmd.action}`,
          );

          if (cmd.action === "RESUME_CONTEXT" && audioContextRef.current) {
            void audioContextRef.current.resume();
          }
        }
      }

      if (type === "TELEMETRY_HEALTHY" && payload?.masterLevel !== undefined) {
        setMixerState((prev) => ({
          ...prev,
          masterVolumeLevel: payload.masterLevel,
        }));
      }
    };

    return () => {
      workerRef.current?.postMessage({ type: "TERMINATE_ENGINE" });
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close();
      workerRef.current = null;
      audioContextRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
      mediaStreamRef.current = null;
    };
  }, [logEvent]);

  return {
    masterVolumeLevel: mixerState.masterVolumeLevel,
    healingLogs: mixerState.healingLogs,
    simulateAudioDrop: isDevSandbox ? simulateAudioDrop : undefined,
  };
}
