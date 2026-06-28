import type Hls from "hls.js";

export type AttachHlsPlaybackOptions = {
  onManifestParsed?: () => void;
  onFatalError?: (details: string) => void;
};

function usesDevHlsRelay(streamUrl: string): boolean {
  return streamUrl.includes("/api/stream/relay");
}

/**
 * Client-only HLS attach — prefers hls.js (MSE) on Chrome; native only on Safari/iOS.
 * Returns a cleanup function that destroys the Hls instance and detaches media.
 */
export async function attachHlsPlayback(
  video: HTMLVideoElement,
  streamUrl: string,
  options: AttachHlsPlaybackOptions = {},
): Promise<() => void> {
  const HlsModule = (await import("hls.js")).default;
  const devRelay = usesDevHlsRelay(streamUrl);

  if (HlsModule.isSupported()) {
    const hls: Hls = new HlsModule({
      enableWorker: !devRelay,
      xhrSetup: (xhr) => {
        xhr.withCredentials = false;
      },
      ...(devRelay
        ? {
            lowLatencyMode: false,
            startFragPrefetch: false,
            testBandwidth: false,
            backBufferLength: 60,
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
            liveSyncDuration: 20,
            liveMaxLatencyDuration: 45,
            maxLiveSyncPlaybackRate: 1,
            maxBufferHole: 0.8,
            nudgeMaxRetry: 2,
            capLevelToPlayerSize: false,
          }
        : {}),
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(video);

    hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
      if (devRelay && hls.levels.length > 0) {
        hls.currentLevel = 0;
        hls.autoLevelCapping = 0;
      }
      options.onManifestParsed?.();
      void video.play().catch(() => undefined);
    });

    hls.on(HlsModule.Events.LEVEL_SWITCHING, () => {
      if (devRelay) {
        hls.currentLevel = 0;
      }
    });

    hls.on(HlsModule.Events.ERROR, (_, data) => {
      if (!data.fatal) return;
      options.onFatalError?.(data.details || data.type || "HLS error");
    });

    return () => {
      hls.destroy();
    };
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = streamUrl;
    video.load();
    options.onManifestParsed?.();
    void video.play().catch(() => undefined);
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }

  options.onFatalError?.("This browser cannot play the live HLS stream.");
  return () => undefined;
}
