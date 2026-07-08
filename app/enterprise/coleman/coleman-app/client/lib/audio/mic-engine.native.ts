import { Audio } from "expo-av";

import type { MicEngineOptions } from "./mic-engine.web";

export function startColemanMicEngine(options: MicEngineOptions): () => void {
  let disposed = false;

  void (async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        options.onError?.("Microphone access is required for live pitch detection.");
        return;
      }

      if (!disposed) {
        options.onError?.(
          "Live pitch tracking runs on COLEMAN Web. Open the web app for real-time note detection.",
        );
      }
    } catch {
      options.onError?.("Microphone access is required for live pitch detection.");
    }
  })();

  return () => {
    disposed = true;
  };
}
