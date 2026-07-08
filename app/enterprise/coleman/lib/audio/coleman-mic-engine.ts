import type { MicEngineOptions, MicPitchFrame } from "./coleman-mic-engine.types";
import { getStageCaptureConfig } from "./stage-capture-config";
import { getStageRoutingManager } from "./stage-routing-manager";
import { micConstraintsForInputMode } from "./stage-audio-types";
import { analyzePitchBuffer, resetPitchAnalyzer } from "./pitch-pipeline";
import { dbToLinearGain } from "./stage-signal-processing";

export type { MicPitchFrame, MicEngineOptions } from "./coleman-mic-engine.types";

function micErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Microphone access was denied. Allow the mic in your browser site settings, then tap DISMISS to retry.";
    }
    if (error.name === "NotFoundError") {
      return "No microphone was found on this device.";
    }
    if (error.name === "NotReadableError") {
      return "The microphone is in use by another app. Close other apps using the mic and retry.";
    }
    if (error.name === "OverconstrainedError") {
      return "Could not open the selected input device. Retry after dismissing this banner.";
    }
  }
  return "Microphone access is required for live pitch detection.";
}

async function ensureAudioContextRunning(context: AudioContext): Promise<void> {
  if (String(context.state) === "running") {
    return;
  }

  try {
    await context.resume();
  } catch {
    // Resume may require a fresh user gesture on some browsers.
  }

  if (String(context.state) === "running") {
    return;
  }

  await new Promise<void>((resolve) => {
    const resume = () => {
      void context.resume().finally(resolve);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
  });
}

async function openMicStream(
  inputMode: ReturnType<ReturnType<typeof getStageRoutingManager>["getState"]>["inputMode"],
  preferredDeviceId: string | null,
): Promise<MediaStream> {
  const processing = micConstraintsForInputMode(inputMode);

  const buildConstraints = (withDevice: boolean): MediaStreamConstraints => {
    const audio: MediaTrackConstraints = {
      ...processing,
    };
    if (withDevice && preferredDeviceId) {
      audio.deviceId = { ideal: preferredDeviceId };
    }
    return { audio };
  };

  try {
    return await navigator.mediaDevices.getUserMedia(buildConstraints(true));
  } catch (error) {
    if (
      !preferredDeviceId ||
      !(error instanceof DOMException) ||
      error.name !== "OverconstrainedError"
    ) {
      throw error;
    }
    return navigator.mediaDevices.getUserMedia(buildConstraints(false));
  }
}

function connectCaptureChain(
  context: AudioContext,
  stream: MediaStream,
): AnalyserNode {
  const captureConfig = getStageCaptureConfig();
  const source = context.createMediaStreamSource(stream);
  const gain = context.createGain();
  gain.gain.value = dbToLinearGain(captureConfig.inputGainDb);

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -30;
  compressor.knee.value = 18;
  compressor.ratio.value = 2.8;
  compressor.attack.value = 0.006;
  compressor.release.value = 0.14;

  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;

  source.connect(gain);
  gain.connect(compressor);
  compressor.connect(analyser);

  return analyser;
}

export function startColemanMicEngine(options: MicEngineOptions): () => void {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    options.onError?.("Microphone input is unavailable in this environment.");
    return () => undefined;
  }

  let disposed = false;
  let rafId: number | null = null;
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let pauseCapture = false;
  let unregisterOutputRef: (() => void) | null = null;

  const stop = () => {
    disposed = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    resetPitchAnalyzer();
    unregisterOutputRef?.();
    unregisterOutputRef = null;
    stream?.getTracks().forEach((track) => track.stop());
    void context?.close();
    stream = null;
    context = null;
  };

  void (async () => {
    try {
      const routingManager = getStageRoutingManager();
      await routingManager.initialize();
      routingManager.setHeadphoneUnplugHandler(() => {
        pauseCapture = true;
        options.onFrame({ currentKey: null, currentCents: 0, isStable: false });
      });

      const routingState = routingManager.getState();
      const preferredDeviceId = routingManager.getPreferredInputDeviceId();

      stream = await openMicStream(routingState.inputMode, preferredDeviceId);

      if (disposed) {
        stop();
        return;
      }

      await routingManager.refreshInputSources();

      context = new AudioContext();
      await ensureAudioContextRunning(context);
      resetPitchAnalyzer();

      const unregisterOutput = routingManager.registerAudioContext(context);
      unregisterOutputRef = unregisterOutput;

      const analyser = connectCaptureChain(context, stream);
      const buffer = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (disposed || !context) {
          return;
        }

        if (pauseCapture) {
          rafId = requestAnimationFrame(tick);
          return;
        }

        if (context.state === "suspended") {
          void context.resume();
        }

        analyser.getFloatTimeDomainData(buffer);
        options.onFrame(analyzePitchBuffer(buffer, context.sampleRate));
        rafId = requestAnimationFrame(tick);
      };

      tick();
    } catch (error) {
      options.onError?.(micErrorMessage(error));
      stop();
    }
  })();

  return stop;
}
