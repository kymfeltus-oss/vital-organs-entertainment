import {
  analyzeFrequency,
  centsFromFrequency,
  detectPitch,
  frequencyToMidi,
  midiToFrequency,
  type PitchAnalysis,
} from "./pitch-core";
import { analyzePitchBuffer, resetPitchAnalyzer } from "./pitch-pipeline";

export type PitchReading = PitchAnalysis;

export function frequencyToNote(frequency: number): PitchReading {
  return analyzeFrequency(frequency);
}

export { analyzePitchBuffer, centsFromFrequency, detectPitch, frequencyToMidi, midiToFrequency, resetPitchAnalyzer };

export function estimateKeyFromFrequency(frequency: number): string {
  if (frequency <= 0) {
    return "—";
  }
  const reading = analyzeFrequency(frequency);
  return `${reading.note} Major`;
}
