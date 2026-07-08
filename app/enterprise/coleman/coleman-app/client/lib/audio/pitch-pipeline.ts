import { PitchPerfectFilter } from "./pitch-perfect-filter";
import {
  analyzeFrequency,
  centsFromFrequency,
  estimateFrequencyWithConfidence,
} from "./pitch-core";
import { getStageCaptureConfig } from "./stage-capture-config";
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

/** Stateful analyzer: VAD + transient rejection + PitchPerfectFilter. */
export class PitchFrameAnalyzer {
  private readonly filter = new PitchPerfectFilter();
  private heldKey: string | null = null;
  private heldCents = 0;
  private lastGateLinear = 0.18;

  reset(): void {
    this.filter.reset();
    this.heldKey = null;
    this.heldCents = 0;
  }

  analyze(buffer: Float32Array, sampleRate: number): PitchFrame {
    const captureConfig = getStageCaptureConfig();
    const gateLinear = dbToLinearMagnitude(captureConfig.noiseGateDb);
    const speechFloorLinear = dbToLinearMagnitude(captureConfig.speechFloorDb);

    if (gateLinear !== this.lastGateLinear) {
      this.filter.setNoiseGateLinear(gateLinear);
      this.lastGateLinear = gateLinear;
    }

    const processed = prepareCaptureBuffer(buffer, sampleRate, captureConfig);
    const metrics = measureSignal(processed);
    const { frequency: rawFrequency, correlation } = estimateFrequencyWithConfidence(
      processed,
      sampleRate,
    );

    const isTransient = isPercussiveTransient(metrics, captureConfig);
    const hasSpeechEnergy = metrics.rms >= speechFloorLinear;
    const hasPitchConfidence =
      correlation >= captureConfig.minPitchCorrelation &&
      isVocalRangeFrequency(rawFrequency);

    if (isTransient || !hasSpeechEnergy || !hasPitchConfidence) {
      if (metrics.rms < speechFloorLinear * 0.45) {
        this.heldKey = null;
        this.heldCents = 0;
        this.filter.reset();
      }
      return {
        currentKey: this.heldKey,
        currentCents: this.heldCents,
        isStable: false,
      };
    }

    const stableNote = this.filter.processRawAudioSignal(rawFrequency, metrics.rms);

    if (stableNote) {
      const cents =
        rawFrequency > 0
          ? Math.max(-50, Math.min(50, centsFromFrequency(rawFrequency)))
          : analyzeFrequency(rawFrequency).cents;

      this.heldKey = stableNote;
      this.heldCents = cents;
      return { currentKey: stableNote, currentCents: cents, isStable: true };
    }

    if (metrics.rms < gateLinear) {
      return {
        currentKey: this.heldKey,
        currentCents: this.heldCents,
        isStable: false,
      };
    }

    const preview = analyzeFrequency(rawFrequency);
    const previewKey = preview.note === "—" ? this.heldKey : preview.note;
    const previewCents =
      preview.note === "—"
        ? this.heldCents
        : Math.max(-50, Math.min(50, preview.cents));

    return {
      currentKey: previewKey,
      currentCents: previewCents,
      isStable: false,
    };
  }
}

let sharedAnalyzer: PitchFrameAnalyzer | null = null;

export function analyzePitchBuffer(
  buffer: Float32Array,
  sampleRate: number,
): PitchFrame {
  if (!sharedAnalyzer) {
    sharedAnalyzer = new PitchFrameAnalyzer();
  }
  return sharedAnalyzer.analyze(buffer, sampleRate);
}

export function resetPitchAnalyzer(): void {
  sharedAnalyzer?.reset();
}
