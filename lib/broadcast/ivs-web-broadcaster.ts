import type { VideoComposition } from "amazon-ivs-web-broadcast";

type IvsBroadcastClientModule = typeof import("amazon-ivs-web-broadcast");
type IvsBroadcastClientInstance = ReturnType<IvsBroadcastClientModule["create"]>;

export type IvsBroadcastStatus =
  | "idle"
  | "sdk_missing"
  | "configured"
  | "broadcasting"
  | "error";

let broadcastClient: IvsBroadcastClientInstance | null = null;
const PROGRAM_VIDEO_NAME = "program-video";
const PROGRAM_AUDIO_NAME = "program-audio";
const PROGRAM_VIDEO_COMPOSITION: VideoComposition = {
  index: 0,
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
};

async function loadIvsBroadcastModule(): Promise<IvsBroadcastClientModule | null> {
  try {
    return await import("amazon-ivs-web-broadcast");
  } catch {
    return null;
  }
}

export async function initializeWebBroadcaster(
  ingestEndpoint: string,
  streamKey: string,
  initialStream?: MediaStream | null,
): Promise<{ ok: boolean; status: IvsBroadcastStatus; message: string }> {
  if (!ingestEndpoint || !streamKey) {
    return {
      ok: false,
      status: "error",
      message: "IVS ingest endpoint and stream key are required.",
    };
  }

  const module = await loadIvsBroadcastModule();
  const factory = module?.create ?? module?.default?.create;
  if (!factory) {
    return {
      ok: false,
      status: "sdk_missing",
      message: "amazon-ivs-web-broadcast is not installed in this project.",
    };
  }

  try {
    const streamConfig =
      module.BASIC_FULL_HD_LANDSCAPE ?? module.default?.BASIC_FULL_HD_LANDSCAPE;
    broadcastClient = factory({ ingestEndpoint, streamConfig });
    if (initialStream) {
      await updateLiveCameraChannel(initialStream);
    }
    await broadcastClient.startBroadcast(streamKey);
    return { ok: true, status: "broadcasting", message: "IVS browser broadcast started." };
  } catch (error) {
    return {
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "Unable to start IVS browser broadcast.",
    };
  }
}

export async function updateLiveCameraChannel(
  newMediaStream: MediaStream,
): Promise<{ ok: boolean; message: string }> {
  if (!broadcastClient) {
    return { ok: false, message: "Broadcast client is not initialized." };
  }

  const videoTrack = newMediaStream.getVideoTracks()[0];
  const audioTrack = newMediaStream.getAudioTracks()[0];

  try {
    if (videoTrack) {
      try {
        broadcastClient.removeVideoInputDevice(PROGRAM_VIDEO_NAME);
      } catch {
        // The first program source has nothing to remove.
      }
      await broadcastClient.addVideoInputDevice(
        newMediaStream,
        PROGRAM_VIDEO_NAME,
        PROGRAM_VIDEO_COMPOSITION,
      );
    }

    if (audioTrack) {
      try {
        broadcastClient.removeAudioInputDevice(PROGRAM_AUDIO_NAME);
      } catch {
        // The first program source has nothing to remove.
      }
      await broadcastClient.addAudioInputDevice(newMediaStream, PROGRAM_AUDIO_NAME);
    }

    return { ok: true, message: "Program media track updated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to update program media track.",
    };
  }
}

export async function stopWebBroadcaster(): Promise<void> {
  broadcastClient?.stopBroadcast();
  broadcastClient = null;
}
