export type MobileUploadSession = {
  streamKey: string;
  mediaStream: MediaStream;
};

/**
 * Attach a labeled mobile uplink session. WebRTC/socket transport lands in a later phase;
 * the stream key is registered server-side so the director console can match Cam 1.
 */
export function initializeMobileUploadPipeline(
  mediaStream: MediaStream,
  streamKey: string,
): MobileUploadSession {
  return {
    streamKey: streamKey.trim(),
    mediaStream,
  };
}
