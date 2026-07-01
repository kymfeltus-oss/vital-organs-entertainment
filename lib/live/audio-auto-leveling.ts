/** Native Web Audio auto-leveling for live HLS playback — gospel concert transient control. */

export type AutoLevelingMatrix = {
  audioContext: AudioContext;
  resume: () => Promise<void>;
  suspend: () => Promise<void>;
  cleanup: () => void;
};

const attachedVideos = new WeakSet<HTMLVideoElement>();

function resolveAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const extendedWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? extendedWindow.webkitAudioContext ?? null;
}

/**
 * Route video element audio through a DynamicsCompressor before speakers.
 * Safe to call once per video element lifetime.
 */
export function attachAutoLevelingMatrix(
  video: HTMLVideoElement,
): AutoLevelingMatrix | null {
  if (attachedVideos.has(video)) return null;

  const AudioContextCtor = resolveAudioContextConstructor();
  if (!AudioContextCtor) return null;

  const audioContext = new AudioContextCtor();
  const source = audioContext.createMediaElementSource(video);
  const compressor = audioContext.createDynamicsCompressor();
  const now = audioContext.currentTime;

  compressor.threshold.setValueAtTime(-16, now);
  compressor.knee.setValueAtTime(12, now);
  compressor.ratio.setValueAtTime(4, now);
  compressor.attack.setValueAtTime(0.01, now);
  compressor.release.setValueAtTime(0.25, now);

  source.connect(compressor);
  compressor.connect(audioContext.destination);

  attachedVideos.add(video);

  return {
    audioContext,
    resume: () => audioContext.resume(),
    suspend: () => audioContext.suspend(),
    cleanup: () => {
      try {
        source.disconnect();
        compressor.disconnect();
      } catch {
        // Nodes may already be torn down during unmount.
      }
      attachedVideos.delete(video);
      void audioContext.close();
    },
  };
}
