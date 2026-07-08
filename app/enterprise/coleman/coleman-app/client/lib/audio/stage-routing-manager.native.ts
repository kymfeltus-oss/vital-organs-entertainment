import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

import { applyInputModeCapture } from "./stage-capture-config";
import {
  ACOUSTIC_CAPTURE_CONFIG,
  DEFAULT_STAGE_AUDIO_STATE,
  DIRECT_LINE_CAPTURE_CONFIG,
  type StageAudioState,
  type StageRoutingProfile,
} from "./stage-audio-types";

type StageRoutingListener = (state: StageAudioState) => void;

let nativeSingleton: StageRoutingManager | null = null;

/**
 * Native stage routing via expo-av — headphones/IEM bus vs forced speaker playback.
 */
export class StageRoutingManager {
  private state: StageAudioState = { ...DEFAULT_STAGE_AUDIO_STATE };
  private listeners = new Set<StageRoutingListener>();
  private initialized = false;
  private headphoneUnplugHandler: (() => void) | null = null;

  static getInstance(): StageRoutingManager {
    if (!nativeSingleton) {
      nativeSingleton = new StageRoutingManager();
    }
    return nativeSingleton;
  }

  subscribe(listener: StageRoutingListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): StageAudioState {
    return this.state;
  }

  getPreferredInputDeviceId(): string | null {
    return null;
  }

  setHeadphoneUnplugHandler(handler: (() => void) | null): void {
    this.headphoneUnplugHandler = handler;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    await this.refreshInputSources();
    await this.applyRoutingProfile(this.state.routingProfile);
    this.patchState({ isInitialized: true });
  }

  dispose(): void {
    this.listeners.clear();
    this.initialized = false;
  }

  async setRoutingProfile(profile: StageRoutingProfile): Promise<void> {
    await this.applyRoutingProfile(profile);
    this.patchState({ routingProfile: profile });
  }

  setNoiseGateDb(db: number): void {
    const clamped = Math.max(-160, Math.min(0, db));
    applyInputModeCapture(this.state.inputMode, clamped);
    this.patchState({ noiseGateDb: clamped });
  }

  async refreshInputSources(): Promise<void> {
    const permission = await Audio.requestPermissionsAsync();
    const canRecord = permission.status === "granted";

    const inputMode = canRecord ? "acoustic" : "acoustic";
    const externalLineConnected = false;
    const noiseGateDb =
      inputMode === "directLine"
        ? DIRECT_LINE_CAPTURE_CONFIG.noiseGateDb
        : ACOUSTIC_CAPTURE_CONFIG.noiseGateDb;

    applyInputModeCapture(inputMode, noiseGateDb);

    this.patchState({
      inputMode,
      externalLineConnected,
      activeInputLabel: "Internal Microphone",
      noiseGateDb,
      headphonesConnected: this.state.routingProfile === "headphones",
    });
  }

  async pauseStreamsOnHeadphoneUnplug(): Promise<void> {
    this.headphoneUnplugHandler?.();
  }

  private async applyRoutingProfile(profile: StageRoutingProfile): Promise<void> {
    if (profile === "speaker") {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
  }

  private patchState(patch: Partial<StageAudioState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export function getStageRoutingManager(): StageRoutingManager {
  return StageRoutingManager.getInstance();
}
