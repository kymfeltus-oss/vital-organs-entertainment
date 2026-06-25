"use client";

import type { DiscoveredCamera } from "@/lib/cameras/types";

export async function discoverBrowserCameras(): Promise<DiscoveredCamera[]> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === "videoinput")
      .map((d, index) => ({
        id: `browser:${d.deviceId || index}`,
        label: d.label || `Camera ${index + 1}`,
        connectionType: (d.label.toLowerCase().includes("built") ? "built_in" : "usb") as DiscoveredCamera["connectionType"],
        hardwareLabel: d.label || null,
        deviceIndex: index,
        browserDeviceId: d.deviceId || null,
        source: "browser" as const,
      }));
  } catch {
    return [];
  }
}

export async function testBrowserCamera(deviceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
    });
    stream.getTracks().forEach((t) => t.stop());
    return { success: true, message: "Camera is responding." };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Camera test failed.";
    if (raw.toLowerCase().includes("notallowed")) {
      return { success: false, message: "Camera access was blocked. Allow camera permission and try again." };
    }
    return { success: false, message: raw };
  }
}
