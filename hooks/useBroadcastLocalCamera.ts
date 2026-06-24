"use client";

import { useEffect, useState } from "react";
import {
  readBroadcastCameraEngineStatus,
  readBroadcastLocalCameraActive,
  type BroadcastCameraEngineStatus,
} from "@/lib/broadcast/local-camera-session";

export function useBroadcastLocalCamera(): {
  localCameraActive: boolean;
  engineStatus: BroadcastCameraEngineStatus;
} {
  const [localCameraActive, setLocalCameraActive] = useState(false);
  const [engineStatus, setEngineStatus] =
    useState<BroadcastCameraEngineStatus>("stopped");

  useEffect(() => {
    setLocalCameraActive(readBroadcastLocalCameraActive());
    setEngineStatus(readBroadcastCameraEngineStatus());

    const onCameraChange = () => {
      setLocalCameraActive(readBroadcastLocalCameraActive());
      setEngineStatus(readBroadcastCameraEngineStatus());
    };

    window.addEventListener("broadcast-local-camera-changed", onCameraChange);
    window.addEventListener("broadcast-camera-engine-changed", onCameraChange);

    return () => {
      window.removeEventListener("broadcast-local-camera-changed", onCameraChange);
      window.removeEventListener("broadcast-camera-engine-changed", onCameraChange);
    };
  }, []);

  return { localCameraActive, engineStatus };
}
