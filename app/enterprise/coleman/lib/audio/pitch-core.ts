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
