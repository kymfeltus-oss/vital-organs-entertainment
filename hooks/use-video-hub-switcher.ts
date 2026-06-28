"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraInput = {
  deviceId: string;
  label: string;
  stream: MediaStream | null;
};

type SwitcherState = {
  availableCameras: CameraInput[];
  activeMasterStream: MediaStream | null;
  activeDeviceId: string | null;
  permissionState: "idle" | "requesting" | "granted" | "denied" | "unsupported";
  error: string | null;
  refreshHardware: () => Promise<void>;
  switchMasterChannel: (deviceId: string) => Promise<MediaStream | null>;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function captureDeviceStream(deviceId: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: { exact: deviceId },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
    audio: true,
  });
}

export function useVideoHubSwitcher(): SwitcherState {
  const [availableCameras, setAvailableCameras] = useState<CameraInput[]>([]);
  const [activeMasterStream, setActiveMasterStream] = useState<MediaStream | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<SwitcherState["permissionState"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const switchMasterChannel = useCallback(async (deviceId: string): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState("unsupported");
      setError("This browser does not support camera capture.");
      return null;
    }

    try {
      const nextStream = await captureDeviceStream(deviceId);
      stopStream(activeStreamRef.current);
      activeStreamRef.current = nextStream;
      setActiveMasterStream(nextStream);
      setActiveDeviceId(deviceId);
      setError(null);
      return nextStream;
    } catch (captureError) {
      const message =
        captureError instanceof Error ? captureError.message : "Unable to switch camera.";
      setError(message);
      return null;
    }
  }, []);

  const refreshHardware = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices.enumerateDevices) {
      setPermissionState("unsupported");
      setError("This browser does not support camera capture.");
      return;
    }

    setPermissionState("requesting");
    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      permissionStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
          stream: null,
        }));

      setAvailableCameras(cameras);
      setPermissionState("granted");
      setError(null);

      if (cameras.length > 0 && !activeStreamRef.current) {
        await switchMasterChannel(cameras[0].deviceId);
      }
    } catch (hardwareError) {
      const message =
        hardwareError instanceof Error ? hardwareError.message : "Camera permission was denied.";
      setPermissionState("denied");
      setError(message);
    }
  }, [switchMasterChannel]);

  useEffect(() => {
    void refreshHardware();
    return () => stopStream(activeStreamRef.current);
  }, [refreshHardware]);

  return {
    availableCameras,
    activeMasterStream,
    activeDeviceId,
    permissionState,
    error,
    refreshHardware,
    switchMasterChannel,
  };
}
