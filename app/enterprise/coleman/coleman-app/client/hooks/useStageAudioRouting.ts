import { useCallback, useEffect, useState } from "react";

import { getStageRoutingManager } from "../lib/audio/stage-routing-manager";
import type {
  StageAudioState,
  StageRoutingProfile,
} from "../lib/audio/stage-audio-types";

export function useStageAudioRouting() {
  const [state, setState] = useState<StageAudioState>(() =>
    getStageRoutingManager().getState(),
  );

  useEffect(() => {
    const manager = getStageRoutingManager();
    void manager.initialize();
    return manager.subscribe(setState);
  }, []);

  const setRoutingProfile = useCallback(async (profile: StageRoutingProfile) => {
    await getStageRoutingManager().setRoutingProfile(profile);
  }, []);

  const refreshInputSources = useCallback(async () => {
    await getStageRoutingManager().refreshInputSources();
  }, []);

  const setNoiseGateDb = useCallback((db: number) => {
    getStageRoutingManager().setNoiseGateDb(db);
  }, []);

  return {
    ...state,
    setRoutingProfile,
    refreshInputSources,
    setNoiseGateDb,
  };
}
