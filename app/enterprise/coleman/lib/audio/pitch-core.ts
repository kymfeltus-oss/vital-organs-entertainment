const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export type PitchAnalysis = {
  note: string;
  frequency: number;
  cents: number;
  midi: number;
};

/** n = 69 + 12 × log₂(f / 440) */
export function frequencyToMidi(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440);
}

/** f_target for nearest MIDI note */
export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** c = 1200 × log₂(f / f_target) */
export function centsFromFrequency(frequency: number): number {
  const midi = frequencyToMidi(frequency);
  const nearestMidi = Math.round(midi);
  const targetFrequency = midiToFrequency(nearestMidi);
  if (targetFrequency <= 0) {
    return 0;
  }
  return Math.round(1200 * Math.log2(frequency / targetFrequency));
}

export function analyzeFrequency(frequency: number): PitchAnalysis {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return { note: "—", frequency: 0, cents: 0, midi: 0 };
  }

  const midi = frequencyToMidi(frequency);
  const nearestMidi = Math.round(midi);
  const cents = centsFromFrequency(frequency);
  const noteIndex = ((nearestMidi % 12) + 12) % 12;

  return {
    note: NOTE_NAMES[noteIndex],
    frequency,
    cents,
    midi,
  };
}

export function computeSignalMagnitude(buffer: Float32Array): number {
  if (buffer.length === 0) {
    return 0;
  }

  let rms = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    rms += buffer[i] * buffer[i];
  }
  return Math.sqrt(rms / buffer.length);
}

export type PitchEstimate = {
  frequency: number;
  correlation: number;
};

export type HybridPitchEstimate = {
  frequency: number;
  confidence: number;
  validated: boolean;
};

const VOCAL_MIN_HZ = 80;
const VOCAL_MAX_HZ = 500;

/** Accept pitch only when time-domain and spectral peaks agree within tolerance. */
export function validateHybridPitch(
  timeHz: number,
  spectralHz: number,
  toleranceCents = 50,
): boolean {
  if (timeHz <= 0 || spectralHz <= 0) {
    return false;
  }
  const cents = Math.abs(1200 * Math.log2(timeHz / spectralHz));
  return cents <= toleranceCents;
}

/**
 * YIN-style cumulative mean normalized difference (CMND).
 * Bounded to vocal fundamentals to reduce octave doubling from pads/organs.
 */
export function estimateFrequencyYin(
  buffer: Float32Array,
  sampleRate: number,
  options?: { minHz?: number; maxHz?: number; threshold?: number },
): { frequency: number; confidence: number } {
  const minHz = options?.minHz ?? VOCAL_MIN_HZ;
  const maxHz = options?.maxHz ?? VOCAL_MAX_HZ;
  const threshold = options?.threshold ?? 0.15;

  if (buffer.length < 512 || sampleRate <= 0) {
    return { frequency: 0, confidence: 0 };
  }

  const minTau = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxTau = Math.min(Math.ceil(sampleRate / minHz), buffer.length - 1);
  if (minTau >= maxTau) {
    return { frequency: 0, confidence: 0 };
  }

  const yinBuffer = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau += 1) {
    let sum = 0;
    for (let i = 0; i < buffer.length - tau; i += 1) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  let runningSum = 0;
  yinBuffer[0] = 1;
  let bestTau = -1;
  let bestCmnd = 1;

  for (let tau = minTau; tau <= maxTau; tau += 1) {
    runningSum += yinBuffer[tau];
    const cmnd = (yinBuffer[tau] * tau) / (runningSum || 1);
    yinBuffer[tau] = cmnd;
    if (cmnd < bestCmnd) {
      bestCmnd = cmnd;
      bestTau = tau;
    }
  }

  if (bestTau < 0 || bestCmnd >= threshold) {
    return { frequency: 0, confidence: 0 };
  }

  let refinedTau = bestTau;
  if (bestTau > minTau && bestTau < maxTau) {
    const y0 = yinBuffer[bestTau - 1];
    const y1 = yinBuffer[bestTau];
    const y2 = yinBuffer[bestTau + 1];
    const denom = y0 - 2 * y1 + y2;
    if (denom !== 0) {
      refinedTau += 0.5 * (y0 - y2) / denom;
    }
  }

  return {
    frequency: sampleRate / refinedTau,
    confidence: Math.max(0, Math.min(1, 1 - bestCmnd)),
  };
}

/** Dominant spectral peak with parabolic bin interpolation (AnalyserNode dB magnitudes). */
export function dominantSpectralPeakHz(
  magnitudeDb: Float32Array,
  sampleRate: number,
  fftSize: number,
  minHz = VOCAL_MIN_HZ,
  maxHz = VOCAL_MAX_HZ,
  hintHz?: number,
): number {
  if (magnitudeDb.length === 0 || sampleRate <= 0 || fftSize <= 0) {
    return 0;
  }

  const binHz = sampleRate / fftSize;
  let searchMinHz = minHz;
  let searchMaxHz = maxHz;

  if (hintHz && hintHz > 0) {
    const ratio = 2 ** (55 / 1200);
    searchMinHz = Math.max(minHz, hintHz / ratio);
    searchMaxHz = Math.min(maxHz, hintHz * ratio);
  }

  const minBin = Math.max(1, Math.ceil(searchMinHz / binHz));
  const maxBin = Math.min(magnitudeDb.length - 2, Math.floor(searchMaxHz / binHz));

  if (minBin > maxBin) {
    return 0;
  }

  let bestBin = -1;
  let bestMag = -Infinity;

  for (let i = minBin; i <= maxBin; i += 1) {
    const db = magnitudeDb[i];
    if (!Number.isFinite(db)) {
      continue;
    }
    if (db > bestMag) {
      bestMag = db;
      bestBin = i;
    }
  }

  if (bestBin < 1) {
    let bestLinear = 0;
    for (let i = minBin; i <= maxBin; i += 1) {
      const db = magnitudeDb[i];
      if (!Number.isFinite(db)) {
        continue;
      }
      const linear = 10 ** (db / 20);
      if (linear > bestLinear) {
        bestLinear = linear;
        bestBin = i;
      }
    }
  }

  if (bestBin < 1) {
    return 0;
  }

  const y0 = magnitudeDb[bestBin - 1];
  const y1 = magnitudeDb[bestBin];
  const y2 = magnitudeDb[bestBin + 1];
  const denom = y0 - 2 * y1 + y2;
  const offset = denom !== 0 ? 0.5 * (y0 - y2) / denom : 0;
  const refinedBin = bestBin + offset;

  return refinedBin * binHz;
}

/** Hybrid time-domain YIN + spectral peak agreement gate. */
export function estimateHybridPitch(
  buffer: Float32Array,
  sampleRate: number,
  magnitudeDb?: Float32Array,
  fftSize?: number,
): HybridPitchEstimate {
  const yin = estimateFrequencyYin(buffer, sampleRate);

  if (yin.frequency <= 0) {
    return { frequency: 0, confidence: 0, validated: false };
  }

  if (!magnitudeDb || !fftSize) {
    return { frequency: yin.frequency, confidence: yin.confidence * 0.75, validated: false };
  }

  const spectralHz = dominantSpectralPeakHz(magnitudeDb, sampleRate, fftSize, VOCAL_MIN_HZ, VOCAL_MAX_HZ, yin.frequency);
  const validated = validateHybridPitch(yin.frequency, spectralHz, 55);

  if (!validated) {
    return { frequency: 0, confidence: 0, validated: false };
  }

  return {
    frequency: yin.frequency,
    confidence: yin.confidence,
    validated: true,
  };
}

export function estimateFrequencyWithConfidence(
  buffer: Float32Array,
  sampleRate: number,
): PitchEstimate {
  const size = buffer.length;
  if (size < 512 || sampleRate <= 0) {
    return { frequency: 0, correlation: 0 };
  }

  let bestOffset = -1;
  let bestCorrelation = 0;
  const minOffset = Math.floor(sampleRate / 900);
  const maxOffset = Math.floor(sampleRate / 70);

  for (let offset = minOffset; offset < maxOffset; offset += 1) {
    let correlation = 0;
    for (let i = 0; i < size - offset; i += 1) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / (size - offset);

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation <= 0.01 || bestOffset <= 0) {
    return { frequency: 0, correlation: 0 };
  }

  return {
    frequency: sampleRate / bestOffset,
    correlation: bestCorrelation,
  };
}

export function estimateFrequency(buffer: Float32Array, sampleRate: number): number {
  return estimateFrequencyWithConfidence(buffer, sampleRate).frequency;
}

export function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const size = buffer.length;
  if (size < 512 || sampleRate <= 0) {
    return 0;
  }

  const rms = computeSignalMagnitude(buffer);

  if (rms < 0.008) {
    return 0;
  }

  return estimateFrequency(buffer, sampleRate);
}

export function analyzePitchBufferLegacy(
  buffer: Float32Array,
  sampleRate: number,
): { currentKey: string | null; currentCents: number } {
  const frequency = detectPitch(buffer, sampleRate);
  if (frequency <= 0) {
    return { currentKey: null, currentCents: 0 };
  }

  const reading = analyzeFrequency(frequency);
  return {
    currentKey: reading.note === "—" ? null : reading.note,
    currentCents: Math.max(-50, Math.min(50, reading.cents)),
  };
}
