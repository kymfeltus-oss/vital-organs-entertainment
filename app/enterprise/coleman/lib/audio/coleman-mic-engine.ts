import type { MicEngineOptions, MicPitchFrame } from "./coleman-mic-engine.types";
import { analyzePitchBuffer } from "./pitch-core";

export type { MicPitchFrame, MicEngineOptions } from "./coleman-mic-engine.types";

export function startColemanMicEngine(options: MicEngineOptions): () => void {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    options.onError?.("Microphone input is unavailable in this environment.");
    return () => undefined;
  }

  let disposed = false;
  let rafId: number | null = null;
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let worker: Worker | null = null;
  let workerBusy = false;

  const stop = () => {
    disposed = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    worker?.terminate();
    worker = null;
    stream?.getTracks().forEach((track) => track.stop());
    void context?.close();
    stream = null;
    context = null;
  };

  void (async () => {
    try {
      try {
        worker = new Worker(new URL("./coleman-pitch.worker.ts", import.meta.url), {
          type: "module",
        });

        worker.onmessage = (event: MessageEvent<{ type: string; currentKey: string | null; currentCents: number }>) => {
          workerBusy = false;
          if (disposed || event.data.type !== "frame") {
            return;
          }
          options.onFrame({
            currentKey: event.data.currentKey,
            currentCents: event.data.currentCents,
          });
        };

        worker.onerror = () => {
          worker?.terminate();
          worker = null;
        };
      } catch {
        worker = null;
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      if (disposed) {
        stop();
        return;
      }

      context = new AudioContext();
      await context.resume();

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (disposed || !context || !worker) {
          return;
        }

        if (!workerBusy) {
          analyser.getFloatTimeDomainData(buffer);

          if (worker) {
            workerBusy = true;
            const snapshot = new Float32Array(buffer);
            worker.postMessage(
              {
                type: "analyze",
                buffer: snapshot,
                sampleRate: context.sampleRate,
              },
              [snapshot.buffer],
            );
          } else {
            options.onFrame(analyzePitchBuffer(buffer, context.sampleRate));
          }
        }

        rafId = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      options.onError?.("Microphone access is required for live pitch detection.");
      stop();
    }
  })();

  return stop;
}
