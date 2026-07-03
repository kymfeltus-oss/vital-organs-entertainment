import type Hls from "hls.js";

export type AttachHlsPlaybackOptions = {
  startMuted?: boolean;
  onManifestParsed?: () => void;
  onAutoplayBlocked?: (error: unknown) => void;
  onRecovering?: (details: string) => void;
  onFatalError?: (details: string) => void;
};

export const HLS_STARTUP_RETRY_CONFIG = {
  manifestLoadingMaxRetry: 20,
  manifestLoadingRetryDelay: 2_000,
  manifestLoadingMaxRetryTimeout: 60_000,
  backOffIndex: 2,
  levelLoadingMaxRetry: 12,
  levelLoadingRetryDelay: 2_000,
  levelLoadingMaxRetryTimeout: 60_000,
  fragLoadingMaxRetry: 8,
  fragLoadingRetryDelay: 1_500,
  fragLoadingMaxRetryTimeout: 45_000,
};

const HLS_SOFT_RECOVERY_LIMIT = 2;
const HLS_CACHE_BUST_PARAM = "_hls_t";

export function cacheBustHlsPlaybackUrl(streamUrl: string): string {
  const cacheBustValue = `${Date.now()}`;
  const isAbsoluteUrl = /^[a-z][a-z\d+\-.]*:/i.test(streamUrl);

  try {
    const baseUrl = typeof window === "undefined" ? "http://localhost" : window.location.href;
    const url = new URL(streamUrl, baseUrl);
    url.searchParams.set(HLS_CACHE_BUST_PARAM, cacheBustValue);
    return isAbsoluteUrl ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const separator = streamUrl.includes("?") ? "&" : "?";
    return `${streamUrl}${separator}${HLS_CACHE_BUST_PARAM}=${cacheBustValue}`;
  }
}

export function reportAutoplayBlocked(
  video: HTMLVideoElement,
  options: Pick<AttachHlsPlaybackOptions, "onAutoplayBlocked">,
): void {
  void video.play().catch((error: unknown) => {
    options.onAutoplayBlocked?.(error);
  });
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
  const playbackUrl = cacheBustHlsPlaybackUrl(streamUrl);
  const startMuted = options.startMuted ?? true;

  if (HlsModule.isSupported()) {
    let softRecoveryAttempts = 0;
    const hls: Hls = new HlsModule({
      ...HLS_STARTUP_RETRY_CONFIG,
      enableWorker: true,
      xhrSetup: (xhr) => {
        xhr.withCredentials = false;
      },
    });

    hls.loadSource(playbackUrl);
    hls.attachMedia(video);

    hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
      softRecoveryAttempts = 0;
      options.onManifestParsed?.();
      video.playsInline = true;
      video.muted = startMuted;
      reportAutoplayBlocked(video, options);
    });

    hls.on(HlsModule.Events.ERROR, (_, data) => {
      if (!data.fatal) return;
      const details = data.details || data.type || "HLS error";

      if (
        data.type === HlsModule.ErrorTypes.NETWORK_ERROR &&
        softRecoveryAttempts < HLS_SOFT_RECOVERY_LIMIT
      ) {
        softRecoveryAttempts += 1;
        options.onRecovering?.(details);
        hls.startLoad(-1);
        return;
      }

      if (
        data.type === HlsModule.ErrorTypes.MEDIA_ERROR &&
        softRecoveryAttempts < HLS_SOFT_RECOVERY_LIMIT
      ) {
        softRecoveryAttempts += 1;
        options.onRecovering?.(details);
        hls.recoverMediaError();
        return;
      }

      options.onFatalError?.(details);
    });

    return () => {
      hls.destroy();
    };
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.playsInline = true;
    video.muted = startMuted;
    video.src = playbackUrl;
    video.load();
    options.onManifestParsed?.();
    reportAutoplayBlocked(video, options);
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }

  options.onFatalError?.("This browser cannot play the live HLS stream.");
  return () => undefined;
}
