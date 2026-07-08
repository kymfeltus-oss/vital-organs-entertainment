/** Convert linear RMS magnitude to decibels. */
export function linearRmsToDb(rms: number): number {
  return 20 * Math.log10(Math.max(rms, 1e-8));
}

/** Convert decibels to linear RMS magnitude. */
export function dbToLinearRms(db: number): number {
  const clamped = Math.max(-160, Math.min(0, db));
  return 10 ** (clamped / 20);
}

/**
 * Rolling ambient noise floor tracker for live sanctuary environments.
 * Activation threshold = ambient floor + 12 dB, floored by configured noise gate.
 */
export class AdaptiveSanctuaryVAD {
  private floorSamplesDb: number[] = [];
  private readonly windowFrames: number;

  constructor(tickRateHz = 60, windowSeconds = 3) {
    this.windowFrames = Math.max(1, Math.round(tickRateHz * windowSeconds));
  }

  reset(): void {
    this.floorSamplesDb.length = 0;
  }

  /**
   * @param rmsLinear - frame RMS magnitude (0…1)
   * @param isSpeechCandidate - when false, sample contributes to ambient floor estimate
   * @param noiseGateDbCeiling - hard minimum gate from capture config (e.g. -38 dB)
   * @returns activation threshold in linear RMS
   */
  activationThresholdLinear(
    rmsLinear: number,
    _isSpeechCandidate: boolean,
    noiseGateDbCeiling: number,
  ): number {
    const rmsDb = linearRmsToDb(rmsLinear);

    const ambientFloorDb =
      this.floorSamplesDb.length > 0
        ? this.floorSamplesDb.reduce((sum, sample) => sum + sample, 0) /
          this.floorSamplesDb.length
        : -55;

    const adaptiveDb = ambientFloorDb + 12;
    const effectiveDb = Math.max(adaptiveDb, noiseGateDbCeiling);

    // Only quiet frames update the ambient floor — avoids pitch-validation feedback loop.
    if (rmsDb <= effectiveDb) {
      this.floorSamplesDb.push(rmsDb);
      if (this.floorSamplesDb.length > this.windowFrames) {
        this.floorSamplesDb.shift();
      }
    }

    const updatedFloorDb =
      this.floorSamplesDb.length > 0
        ? this.floorSamplesDb.reduce((sum, sample) => sum + sample, 0) /
          this.floorSamplesDb.length
        : -55;

    const updatedAdaptiveDb = Math.max(updatedFloorDb + 12, noiseGateDbCeiling);
    return dbToLinearRms(updatedAdaptiveDb);
  }
}
