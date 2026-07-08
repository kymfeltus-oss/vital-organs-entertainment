import { Platform } from "react-native";

export type { StageAudioState, StageRoutingProfile } from "./stage-audio-types";

export {
  StageRoutingManager,
  getStageRoutingManager,
} from Platform.OS === "web"
  ? "./stage-routing-manager.web"
  : "./stage-routing-manager.native";
