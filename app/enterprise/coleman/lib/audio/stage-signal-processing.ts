import type { StageCaptureConfig } from "./stage-audio-types";

/** Convert decibels (-160…0) to linear RMS magnitude (0…1). */
export function dbToLinearMagnitude(db: number): number {
  const clamped = Math.max(-160, Math.min(0, db));
  return Math.pow(10, clamped / 20);
}

/** Convert gain in dB to linear multiplier for GainNode. */
export function dbToLinearGain(db: number): number {
  return Math.pow(10, db / 20);
}

export type SignalMetrics = {
  rms: number;
  peak: number;
  crestFactor: number;
};

export function measureSignal(buffer: Float32Array): SignalMetrics {
  if (buffer.length === 0) {
    return { rms: 0, peak: 0, crestFactor: 0 };
  }

  let sumSquares = 0;
  let peak = 0;

  for (let i = 0; i < buffer.length; i += 1) {
    const sample = buffer[i];
    const magnitude = Math.abs(sample);
    sumSquares += sample * sample;
    if (magnitude > peak) {
      peak = magnitude;
    }
  }

  const rms = Math.sqrt(sumSquares / buffer.length);
  const crestFactor = rms > 0 ? peak / rms : 0;

  return { rms, peak, crestFactor };
}

/**
 * Percussive transients (phone drops, taps) have high crest factor and poor pitch.
 * Sustained vowels sit around 2–4× peak/RMS.
 */
export function isPercussiveTransient(
  metrics: SignalMetrics,
  config: StageCaptureConfig,
): boolean {
  const speechFloor = dbToLinearMagnitude(config.speechFloorDb);
  if (metrics.rms < speechFloor) {
    return false;
  }
  return metrics.crestFactor >= config.maxCrestFactor;
}

/** Single-pole IIR high-pass — sub-bass / organ rumble rejection fallback path. */
export function applyHighPassInPlace(
  buffer: Float32Array,
  sampleRate: number,
  cutoffHz: number,
): void {
  if (buffer.length === 0 || sampleRate <= 0 || cutoffHz <= 0) {
    return;
  }

  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = rc / (rc + 1 / sampleRate);
  let previousInput = buffer[0] ?? 0;
  let previousOutput = 0;

  for (let i = 0; i < buffer.length; i += 1) {
    const input = buffer[i];
    const output = alpha * (previousOutput + input - previousInput);
    buffer[i] = output;
    previousInput = input;
    previousOutput = output;
  }
}

/** Single-pole IIR low-pass — stage bleed rejection for acoustic air mode. */
export function applyLowPassInPlace(
  buffer: Float32Array,
  sampleRate: number,
  cutoffHz: number,
): void {
  if (buffer.length === 0 || sampleRate <= 0 || cutoffHz <= 0) {
    return;
  }

  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = 1 / (sampleRate * rc + 1);
  let smoothed = buffer[0] ?? 0;

  for (let i = 0; i < buffer.length; i += 1) {
    smoothed += alpha * (buffer[i] - smoothed);
    buffer[i] = smoothed;
  }
}

export function prepareCaptureBuffer(
  buffer: Float32Array,
  sampleRate: number,
  config: StageCaptureConfig,
): Float32Array {
  const needsHpf = Boolean(config.highPassCutoffHz);
  const needsLpf = Boolean(config.lowPassCutoffHz);

  if (!needsHpf && !needsLpf) {
    return buffer;
  }

  const filtered = new Float32Array(buffer);

  if (needsHpf && config.highPassCutoffHz) {
    applyHighPassInPlace(filtered, sampleRate, config.highPassCutoffHz);
    applyHighPassInPlace(filtered, sampleRate, config.highPassCutoffHz);
  }

  if (needsLpf && config.lowPassCutoffHz) {
    applyLowPassInPlace(filtered, sampleRate, config.lowPassCutoffHz);
  }

  return filtered;
}

export function isVocalRangeFrequency(frequency: number): boolean {
  return frequency >= 80 && frequency <= 500;
}
