import {
  classifyInputDevice,
  detectHeadphonesConnected,
  enumerateStageAudioDevices,
  pickPreferredInput,
} from "./input-source-detector";
import { applyInputModeCapture, applyPersistedCaptureSettings } from "./stage-capture-config";
import {
  labelForInputSource,
  type RoutingInputSource,
  type RoutingSelectedMode,
} from "../routing-persistence";
import {
  applySinkToAudioContext,
  applySinkToMediaElement,
  isSinkSelectionSupported,
  pickBuiltInSpeakerOutput,
  pickHeadphoneOutput,
  resolveSinkId,
} from "./stage-output-sink";
import {
  ACOUSTIC_CAPTURE_CONFIG,
  COLEMAN_ROUTING_PROFILE_KEY,
  DEFAULT_STAGE_AUDIO_STATE,
  DIRECT_LINE_CAPTURE_CONFIG,
  type StageAudioState,
  type StageRoutingProfile,
} from "./stage-audio-types";

type StageRoutingListener = (state: StageAudioState) => void;

type RegisteredMediaElement = {
  kind: "media";
  element: HTMLMediaElement;
};

type RegisteredAudioContext = {
  kind: "context";
  context: AudioContext;
};

type RegisteredSink = RegisteredMediaElement | RegisteredAudioContext;

declare global {
  interface Window {
    __colemanStageRouting?: StageRoutingManager;
  }
}

function readPersistedRoutingProfile(): StageRoutingProfile {
  if (typeof window === "undefined") {
    return DEFAULT_STAGE_AUDIO_STATE.routingProfile;
  }

  const stored = sessionStorage.getItem(COLEMAN_ROUTING_PROFILE_KEY);
  return stored === "speaker" ? "speaker" : "headphones";
}

function persistRoutingProfile(profile: StageRoutingProfile): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(COLEMAN_ROUTING_PROFILE_KEY, profile);
}

/**
 * Hardware abstraction for stage output routing and input source isolation.
 * Web: MediaDevices + setSinkId on registered HTMLMediaElement / AudioContext nodes.
 */
export class StageRoutingManager {
  private state: StageAudioState = {
    ...DEFAULT_STAGE_AUDIO_STATE,
    routingProfile: readPersistedRoutingProfile(),
    sinkSelectionSupported: isSinkSelectionSupported(),
  };
  private listeners = new Set<StageRoutingListener>();
  private preferredInputDeviceId: string | null = null;
  private headphoneUnplugHandler: (() => void) | null = null;
  private lastHeadphonesConnected = false;
  private deviceChangeBound: (() => void) | null = null;
  private initPromise: Promise<void> | null = null;
  private registeredSinks = new Set<RegisteredSink>();

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

  registerMediaElement(element: HTMLMediaElement): () => void {
    const entry: RegisteredMediaElement = { kind: "media", element };
    this.registeredSinks.add(entry);
    void this.applyRoutingProfile(this.state.routingProfile);
    return () => {
      this.registeredSinks.delete(entry);
    };
  }

  registerAudioContext(context: AudioContext): () => void {
    const entry: RegisteredAudioContext = { kind: "context", context };
    this.registeredSinks.add(entry);
    void this.applyRoutingProfile(this.state.routingProfile);
    return () => {
      this.registeredSinks.delete(entry);
    };
  }

  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (typeof window === "undefined") {
      return;
    }

    this.initPromise = this.runInitialize();
    return this.initPromise;
  }

  private async runInitialize(): Promise<void> {
    this.patchState({
      sinkSelectionSupported: isSinkSelectionSupported(),
      routingProfile: readPersistedRoutingProfile(),
    });

    await this.refreshInputSources();
    const result = await this.applyRoutingProfile(this.state.routingProfile);
    if (result.ok) {
      this.patchState({
        activeOutputLabel: result.outputLabel,
        activeOutputDeviceId: result.outputDeviceId,
      });
    }

    this.lastHeadphonesConnected = this.state.headphonesConnected;

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
    this.registeredSinks.clear();
    this.initPromise = null;
  }

  clearRoutingError(): void {
    this.patchState({ routingError: null });
  }

  async setRoutingProfile(profile: StageRoutingProfile): Promise<void> {
    this.patchState({ routingBusy: true, routingError: null });

    try {
      const result = await this.applyRoutingProfile(profile);
      if (!result.ok) {
        this.patchState({
          routingBusy: false,
          routingError: result.message,
        });
        return;
      }

      persistRoutingProfile(profile);
      this.patchState({
        routingProfile: profile,
        routingBusy: false,
        routingError: null,
        activeOutputLabel: result.outputLabel,
        activeOutputDeviceId: result.outputDeviceId,
      });
    } catch {
      this.patchState({
        routingBusy: false,
        routingError: "Unable to switch audio output on this device.",
      });
    }
  }

  setNoiseGateDb(db: number): void {
    const clamped = Math.max(-160, Math.min(0, db));
    applyInputModeCapture(this.state.inputMode, clamped);
    this.patchState({ noiseGateDb: clamped });
  }

  async applyPersistedRoutingConfig(config: {
    selectedMode: RoutingSelectedMode;
    inputSource: RoutingInputSource;
    noiseGateDb: number;
    lowPassCutoffHz: number;
    latencyOffsetMs: number;
  }): Promise<void> {
    const inputMode = applyPersistedCaptureSettings(
      config.inputSource,
      config.noiseGateDb,
      config.lowPassCutoffHz,
      config.latencyOffsetMs,
    );

    this.patchState({
      inputMode,
      externalLineConnected: config.inputSource !== "ACOUSTIC_AIR",
      activeInputLabel: labelForInputSource(config.inputSource),
      noiseGateDb: Math.max(-160, Math.min(0, config.noiseGateDb)),
    });

    const profile: StageRoutingProfile =
      config.selectedMode === "HEADPHONES" ? "headphones" : "speaker";
    await this.setRoutingProfile(profile);
  }

  async refreshInputSources(): Promise<void> {
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

    const headphonesConnected = detectHeadphonesConnected(outputs);

    this.patchState({
      inputMode,
      externalLineConnected,
      activeInputLabel: preferred?.label ?? "Internal Microphone",
      noiseGateDb,
      headphonesConnected,
      sinkSelectionSupported: isSinkSelectionSupported(),
    });
  }

  private async applyRoutingProfile(profile: StageRoutingProfile): Promise<{
    ok: boolean;
    message: string;
    outputLabel: string;
    outputDeviceId: string | null;
  }> {
    const { outputs } = await enumerateStageAudioDevices();
    const sinkSupported = isSinkSelectionSupported();

    if (profile === "headphones") {
      const headphoneOutput = pickHeadphoneOutput(outputs);
      const sinkId = resolveSinkId(headphoneOutput);
      const applied = await this.applySinkToAllRegistered(sinkId);

      if (!headphoneOutput && !sinkSupported) {
        return {
          ok: true,
          message: "",
          outputLabel: "In-Ears (system default)",
          outputDeviceId: null,
        };
      }

      if (!applied && sinkSupported) {
        return {
          ok: false,
          message: "Could not route playback to in-ear output. Reconnect headphones and try again.",
          outputLabel: this.state.activeOutputLabel,
          outputDeviceId: this.state.activeOutputDeviceId,
        };
      }

      return {
        ok: true,
        message: "",
        outputLabel: headphoneOutput?.label ?? "In-Ears (system default)",
        outputDeviceId: headphoneOutput?.deviceId ?? null,
      };
    }

    const speakerOutput = pickBuiltInSpeakerOutput(outputs);
    const sinkId = resolveSinkId(speakerOutput);

    if (!sinkSupported) {
      if (this.state.headphonesConnected) {
        return {
          ok: false,
          message:
            "Phone speaker routing requires a supported browser. Unplug headphones or use Chrome/Edge on Android.",
          outputLabel: this.state.activeOutputLabel,
          outputDeviceId: this.state.activeOutputDeviceId,
        };
      }

      return {
        ok: true,
        message: "",
        outputLabel: "Phone Speaker (system default)",
        outputDeviceId: null,
      };
    }

    const applied = await this.applySinkToAllRegistered(sinkId);
    if (!applied) {
      return {
        ok: false,
        message: "Could not force phone speaker output on this device.",
        outputLabel: this.state.activeOutputLabel,
        outputDeviceId: this.state.activeOutputDeviceId,
      };
    }

    return {
      ok: true,
      message: "",
      outputLabel: speakerOutput?.label ?? "Phone Speaker",
      outputDeviceId: speakerOutput?.deviceId ?? null,
    };
  }

  private async applySinkToAllRegistered(sinkId: string): Promise<boolean> {
    if (this.registeredSinks.size === 0) {
      return isSinkSelectionSupported();
    }

    let appliedAny = false;

    for (const sink of this.registeredSinks) {
      if (sink.kind === "media") {
        const applied = await applySinkToMediaElement(sink.element, sinkId);
        appliedAny = appliedAny || applied;
        continue;
      }

      const applied = await applySinkToAudioContext(sink.context, sinkId);
      appliedAny = appliedAny || applied;
    }

    return appliedAny || !isSinkSelectionSupported();
  }

  private async handleDeviceChange(): Promise<void> {
    const previousHeadphones = this.lastHeadphonesConnected;
    await this.refreshInputSources();
    const result = await this.applyRoutingProfile(this.state.routingProfile);
    if (result.ok) {
      this.patchState({
        activeOutputLabel: result.outputLabel,
        activeOutputDeviceId: result.outputDeviceId,
      });
    }

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
