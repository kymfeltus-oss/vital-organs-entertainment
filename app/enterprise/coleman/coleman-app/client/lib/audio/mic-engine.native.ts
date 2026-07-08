import { Audio } from "expo-av";

import { getStageRoutingManager } from "./stage-routing-manager";
import type { MicEngineOptions } from "./mic-engine.web";

export function startColemanMicEngine(options: MicEngineOptions): () => void {
  let disposed = false;

  void (async () => {
    try {
      const routingManager = getStageRoutingManager();
      await routingManager.initialize();
      await routingManager.setRoutingProfile(routingManager.getState().routingProfile);

      routingManager.setHeadphoneUnplugHandler(() => {
        options.onFrame({ currentKey: null, currentCents: 0 });
      });

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
