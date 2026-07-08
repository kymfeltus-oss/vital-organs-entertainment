import {
  classifyInputDevice,
  detectHeadphonesConnected,
  enumerateStageAudioDevices,
  pickPreferredInput,
} from "./input-source-detector";
import { applyInputModeCapture } from "./stage-capture-config";
import {
  ACOUSTIC_CAPTURE_CONFIG,
  DEFAULT_STAGE_AUDIO_STATE,
  DIRECT_LINE_CAPTURE_CONFIG,
  type StageAudioState,
  type StageRoutingProfile,
} from "./stage-audio-types";

type StageRoutingListener = (state: StageAudioState) => void;

declare global {
  interface Window {
    __colemanStageRouting?: StageRoutingManager;
  }
}

/**
 * Hardware abstraction for stage output routing and input source isolation.
 * Web: MediaDevices + HTMLAudioElement.setSinkId where supported.
 */
export class StageRoutingManager {
  private state: StageAudioState = { ...DEFAULT_STAGE_AUDIO_STATE };
  private listeners = new Set<StageRoutingListener>();
  private initialized = false;
  private preferredInputDeviceId: string | null = null;
  private headphoneUnplugHandler: (() => void) | null = null;
  private lastHeadphonesConnected = false;
  private deviceChangeBound: (() => void) | null = null;

  static getInstance(): StageRoutingManager {
    if (typeof window !== "undefined") {
      if (!window.__colemanStageRouting) {
        window.__colemanStageRouting = new StageRoutingManager();
      }
      return window.__colemanStageRouting;
    }
    return new StageRoutingManager();
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
    return this.preferredInputDeviceId;
  }

  setHeadphoneUnplugHandler(handler: (() => void) | null): void {
    this.headphoneUnplugHandler = handler;
  }

  async initialize(): Promise<void> {
    if (this.initialized || typeof window === "undefined") {
      return;
    }

    this.initialized = true;
    await this.refreshInputSources();
    await this.applyRoutingProfile(this.state.routingProfile);

    this.deviceChangeBound = () => {
      void this.handleDeviceChange();
    };
    navigator.mediaDevices?.addEventListener("devicechange", this.deviceChangeBound);
    this.patchState({ isInitialized: true });
  }

  dispose(): void {
    if (this.deviceChangeBound && navigator.mediaDevices) {
      navigator.mediaDevices.removeEventListener("devicechange", this.deviceChangeBound);
    }
    this.deviceChangeBound = null;
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
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permissionStream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      // Labels may stay blank until permission is granted elsewhere.
    }

    const { inputs, outputs } = await enumerateStageAudioDevices();
    const preferred = pickPreferredInput(inputs);
    this.preferredInputDeviceId = preferred?.deviceId ?? null;

    const inputMode = preferred ? classifyInputDevice(preferred) : "acoustic";
    const externalLineConnected = inputMode === "directLine";
    const noiseGateDb =
      inputMode === "directLine"
        ? DIRECT_LINE_CAPTURE_CONFIG.noiseGateDb
        : ACOUSTIC_CAPTURE_CONFIG.noiseGateDb;

    applyInputModeCapture(inputMode, noiseGateDb);

    this.patchState({
      inputMode,
      externalLineConnected,
      activeInputLabel: preferred?.label ?? "Internal Microphone",
      noiseGateDb,
      headphonesConnected: detectHeadphonesConnected(outputs),
    });
  }

  private async applyRoutingProfile(profile: StageRoutingProfile): Promise<void> {
    if (profile === "speaker") {
      await this.forceSpeakerOutput();
      return;
    }
    await this.routeToHeadphoneBus();
  }

  /** Headphones / IEM bus — recording stays active, silent-mode playback enabled. */
  private async routeToHeadphoneBus(): Promise<void> {
    const audioElements = document.querySelectorAll("audio");
    for (const element of audioElements) {
      if ("setSinkId" in element && typeof element.setSinkId === "function") {
        try {
          await element.setSinkId("");
        } catch {
          // Browser chooses default output (typically wired/BT IEM when connected).
        }
      }
    }
  }

  /** Force phone speaker output when the platform exposes sink selection. */
  private async forceSpeakerOutput(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    const { outputs } = await enumerateStageAudioDevices();
    const speakerCandidate =
      outputs.find((device) => /speaker|built-in|default/i.test(device.label)) ??
      outputs.find((device) => !device.isExternal) ??
      null;

    const audioElements = document.querySelectorAll("audio");
    for (const element of audioElements) {
      if ("setSinkId" in element && typeof element.setSinkId === "function") {
        try {
          if (speakerCandidate?.deviceId) {
            await element.setSinkId(speakerCandidate.deviceId);
          } else {
            await element.setSinkId("default");
          }
        } catch {
          // Some browsers block programmatic sink routing.
        }
      }
    }
  }

  private async handleDeviceChange(): Promise<void> {
    const previousHeadphones = this.lastHeadphonesConnected;
    await this.refreshInputSources();

    const unplugged = previousHeadphones && !this.state.headphonesConnected;
    this.lastHeadphonesConnected = this.state.headphonesConnected;

    if (unplugged) {
      this.headphoneUnplugHandler?.();
    }
  }

  private patchState(patch: Partial<StageAudioState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export function getStageRoutingManager(): StageRoutingManager {
  return StageRoutingManager.getInstance();
}
