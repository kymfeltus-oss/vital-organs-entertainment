import { Platform } from "react-native";

import type { MicEngineOptions } from "./mic-engine.web";
import { startColemanMicEngine as startNative } from "./mic-engine.native";
import { startColemanMicEngine as startWeb } from "./mic-engine.web";

export type { MicEngineOptions, MicPitchFrame } from "./mic-engine.web";

export function startColemanMicEngine(options: MicEngineOptions): () => void {
  if (Platform.OS === "web") {
    return startWeb(options);
  }
  return startNative(options);
}
