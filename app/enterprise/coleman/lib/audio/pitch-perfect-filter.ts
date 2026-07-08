/** Production referee between raw FFT pitch and the stage UI. */
export class PitchPerfectFilter {
  private noteHistoryBuffer: string[] = [];
  private readonly bufferStabilityThreshold: number;
  private noiseGateLinear = 0.18;

  private readonly pitchClasses = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "F#",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];

  constructor(stabilityFrames = 3) {
    this.bufferStabilityThreshold = Math.max(2, stabilityFrames);
  }

  public setNoiseGateLinear(threshold: number): void {
    this.noiseGateLinear = Math.max(0, threshold);
  }

  /**
   * Refines a raw, volatile frequency calculation into a guaranteed, stable musical note.
   * @param rawFrequency The raw calculation in Hertz directly from the microphone FFT analyzer.
   * @param signalMagnitude The volume/energy score of the captured frequency block.
   */
  public processRawAudioSignal(rawFrequency: number, signalMagnitude: number): string | null {
    if (signalMagnitude < this.noiseGateLinear) {
      this.noteHistoryBuffer = [];
      return null;
    }

    if (rawFrequency < 80 || rawFrequency > 500) {
      this.noteHistoryBuffer = [];
      return null;
    }

    const computedMidiVal = 12 * Math.log2(rawFrequency / 440.0) + 69;
    const roundedMidiNote = Math.round(computedMidiVal);

    const classIndex = (roundedMidiNote - 12) % 12;
    if (classIndex < 0 || classIndex >= 12) {
      return null;
    }

    const rawDetectedNote = this.pitchClasses[classIndex];

    this.noteHistoryBuffer.push(rawDetectedNote);

    if (this.noteHistoryBuffer.length > this.bufferStabilityThreshold) {
      this.noteHistoryBuffer.shift();
    }

    const isSignalPerfectlyStable = this.noteHistoryBuffer.every(
      (note) => note === rawDetectedNote,
    );

    if (
      isSignalPerfectlyStable &&
      this.noteHistoryBuffer.length === this.bufferStabilityThreshold
    ) {
      return rawDetectedNote;
    }

    return null;
  }

  public reset(): void {
    this.noteHistoryBuffer = [];
  }
}
