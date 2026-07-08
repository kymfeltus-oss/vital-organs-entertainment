import { AdaptiveSanctuaryVAD } from "./adaptive-vad";
import { PitchPerfectFilter } from "./pitch-perfect-filter";
import {
  analyzeFrequency,
  centsFromFrequency,
  estimateHybridPitch,
  midiToFrequency,
} from "./pitch-core";
import { getStageCaptureConfig } from "./stage-capture-config";
import { CAPTURE_STABILITY_FRAMES } from "./stage-audio-types";
import {
  dbToLinearMagnitude,
  isPercussiveTransient,
  isVocalRangeFrequency,
  measureSignal,
  prepareCaptureBuffer,
} from "./stage-signal-processing";

export type PitchFrame = {
  currentKey: string | null;
  currentCents: number;
  isStable: boolean;
};

export type PitchAnalysisContext = {
  magnitudeDb?: Float32Array;
  fftSize?: number;
  /** When true, hardware HPF/LPF already applied — skip software filter pass. */
  preFiltered?: boolean;
};

const MEDIAN_WINDOW = CAPTURE_STABILITY_FRAMES;
const MEDIAN_STABILITY_SEMITONES = 0.5;

class MedianPitchStabilizer {
  private readonly midiHistory: number[] = [];

  reset(): void {
    this.midiHistory.length = 0;
  }

  push(midi: number): number | null {
    this.midiHistory.push(midi);
    if (this.midiHistory.length > MEDIAN_WINDOW) {
      this.midiHistory.shift();
    }
    if (this.midiHistory.length < MEDIAN_WINDOW) {
      return null;
    }
    const sorted = [...this.midiHistory].sort((a, b) => a - b);
    return sorted[Math.floor(MEDIAN_WINDOW / 2)];
  }

  isStable(): boolean {
    if (this.midiHistory.length < MEDIAN_WINDOW) {
      return false;
    }
    const sorted = [...this.midiHistory].sort((a, b) => a - b);
    const median = sorted[Math.floor(MEDIAN_WINDOW / 2)];
    return this.midiHistory.every(
      (value) => Math.abs(value - median) <= MEDIAN_STABILITY_SEMITONES,
    );
  }
}

/** Stateful analyzer: adaptive VAD + hybrid pitch + median + note lock. */
export class PitchFrameAnalyzer {
  private readonly filter: PitchPerfectFilter;
  private readonly medianStabilizer = new MedianPitchStabilizer();
  private readonly vad = new AdaptiveSanctuaryVAD();
  private lastStableKey: string | null = null;
  private lastStableCents = 0;
  private lastGateLinear = 0.18;

  constructor(stabilityFrames = CAPTURE_STABILITY_FRAMES) {
    this.filter = new PitchPerfectFilter(stabilityFrames);
  }

  reset(): void {
    this.filter.reset();
    this.medianStabilizer.reset();
    this.vad.reset();
    this.lastStableKey = null;
    this.lastStableCents = 0;
  }

  analyze(
    buffer: Float32Array,
    sampleRate: number,
    context: PitchAnalysisContext = {},
  ): PitchFrame {
    const captureConfig = getStageCaptureConfig();
    const configuredGateLinear = dbToLinearMagnitude(captureConfig.noiseGateDb);

    if (configuredGateLinear !== this.lastGateLinear) {
      this.filter.setNoiseGateLinear(configuredGateLinear);
      this.lastGateLinear = configuredGateLinear;
    }

    const processed = context.preFiltered
      ? buffer
      : prepareCaptureBuffer(buffer, sampleRate, captureConfig);
    const metrics = measureSignal(processed);

    const hybrid = estimateHybridPitch(
      processed,
      sampleRate,
      context.magnitudeDb,
      context.fftSize,
    );

    const rawFrequency = hybrid.frequency;
    const hasPitchConfidence =
      hybrid.validated &&
      hybrid.confidence >= captureConfig.minPitchCorrelation &&
      isVocalRangeFrequency(rawFrequency);

    const adaptiveThresholdLinear = this.vad.activationThresholdLinear(
      metrics.rms,
      hasPitchConfidence,
      captureConfig.noiseGateDb,
    );

    const isTransient = isPercussiveTransient(metrics, captureConfig);
    const hasSpeechEnergy = metrics.rms >= adaptiveThresholdLinear;

    if (isTransient || !hasSpeechEnergy || !hasPitchConfidence) {
      if (metrics.rms < adaptiveThresholdLinear * 0.45) {
        this.filter.reset();
        this.medianStabilizer.reset();
        this.lastStableKey = null;
        this.lastStableCents = 0;
      }
      return {
        currentKey: null,
        currentCents: 0,
        isStable: false,
      };
    }

    const reading = analyzeFrequency(rawFrequency);
    const medianMidi = this.medianStabilizer.push(reading.midi);
    const medianStable = this.medianStabilizer.isStable();

    if (medianMidi === null || !medianStable) {
      if (this.lastStableKey) {
        return {
          currentKey: this.lastStableKey,
          currentCents: this.lastStableCents,
          isStable: true,
        };
      }
      return {
        currentKey: null,
        currentCents: 0,
        isStable: false,
      };
    }

    const medianFrequency = midiToFrequency(medianMidi);
    const stableNote = this.filter.processRawAudioSignal(medianFrequency, metrics.rms);

    if (!stableNote) {
      if (this.lastStableKey) {
        return {
          currentKey: this.lastStableKey,
          currentCents: this.lastStableCents,
          isStable: true,
        };
      }
      return {
        currentKey: null,
        currentCents: 0,
        isStable: false,
      };
    }

    const cents = Math.max(-50, Math.min(50, centsFromFrequency(rawFrequency)));
    this.lastStableKey = stableNote;
    this.lastStableCents = cents;

    return {
      currentKey: stableNote,
      currentCents: cents,
      isStable: true,
    };
  }
}

let sharedAnalyzer: PitchFrameAnalyzer | null = null;

export function analyzePitchBuffer(
  buffer: Float32Array,
  sampleRate: number,
  context: PitchAnalysisContext = {},
): PitchFrame {
  if (!sharedAnalyzer) {
    sharedAnalyzer = new PitchFrameAnalyzer();
  }
  return sharedAnalyzer.analyze(buffer, sampleRate, context);
}

export function resetPitchAnalyzer(): void {
  sharedAnalyzer?.reset();
}
