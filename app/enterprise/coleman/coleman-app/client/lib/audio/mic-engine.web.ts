import { analyzePitchBuffer } from "./pitch-core";

export type MicPitchFrame = {
  currentKey: string | null;
  currentCents: number;
};

export type MicEngineOptions = {
  onFrame: (frame: MicPitchFrame) => void;
  onError?: (message: string) => void;
};

export function startColemanMicEngine(options: MicEngineOptions): () => void {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    options.onError?.("Microphone input is unavailable in this environment.");
    return () => undefined;
  }

  let disposed = false;
  let rafId: number | null = null;
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;

  const stop = () => {
    disposed = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    stream?.getTracks().forEach((track) => track.stop());
    void context?.close();
    stream = null;
    context = null;
  };

  void (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        if (disposed || !context) {
          return;
        }

        analyser.getFloatTimeDomainData(buffer);
        options.onFrame(analyzePitchBuffer(buffer, context.sampleRate));
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
