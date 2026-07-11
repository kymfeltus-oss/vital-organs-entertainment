import { analyzeFrequency } from "@/app/enterprise/coleman/lib/audio/pitch-core";

const MIN_HZ = 30;
const MAX_HZ = 2000;
const MIN_RMS = 0.008;

export type TunerReading = {
  note: string;
  frequency: number;
  cents: number;
  inTune: boolean;
};

function parabolicPeakOffset(y0: number, y1: number, y2: number): number {
  const denominator = y0 - 2 * y1 + y2;
  if (denominator === 0) {
    return 0;
  }
  return 0.5 * (y0 - y2) / denominator;
}

/** Autocorrelation pitch estimator with parabolic interpolation (30–2000 Hz). */
export function estimateInstrumentPitch(
  buffer: Float32Array,
  sampleRate: number,
): number {
  if (buffer.length < 512 || sampleRate <= 0) {
    return 0;
  }

  let rms = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < MIN_RMS) {
    return 0;
  }

  const minLag = Math.floor(sampleRate / MAX_HZ);
  const maxLag = Math.min(Math.ceil(sampleRate / MIN_HZ), buffer.length - 1);
  if (maxLag <= minLag + 2) {
    return 0;
  }

  let bestLag = minLag;
  let bestCorrelation = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - lag; i += 1) {
      correlation += buffer[i] * buffer[i + lag];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestCorrelation <= 0) {
    return 0;
  }

  const left = bestLag > minLag ? bestLag - 1 : bestLag;
  const right = bestLag < maxLag ? bestLag + 1 : bestLag;

  let cLeft = 0;
  let cCenter = 0;
  let cRight = 0;

  for (let i = 0; i < buffer.length - right; i += 1) {
    cLeft += buffer[i] * buffer[i + left];
    cCenter += buffer[i] * buffer[i + bestLag];
    cRight += buffer[i] * buffer[i + right];
  }

  const offset = parabolicPeakOffset(cLeft, cCenter, cRight);
  const refinedLag = bestLag + offset;

  if (refinedLag <= 0) {
    return 0;
  }

  return sampleRate / refinedLag;
}

export function readTunerFromBuffer(
  buffer: Float32Array,
  sampleRate: number,
  inTuneWindowCents = 2,
): TunerReading {
  const frequency = estimateInstrumentPitch(buffer, sampleRate);
  if (frequency <= 0) {
    return { note: "—", frequency: 0, cents: 0, inTune: false };
  }

  const analysis = analyzeFrequency(frequency);
  const inTune = Math.abs(analysis.cents) <= inTuneWindowCents;

  return {
    note: analysis.note,
    frequency,
    cents: analysis.cents,
    inTune,
  };
}
