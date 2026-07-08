import { formatProgressionEntry, normalizeNoteName } from "./live-theory";

const STABLE_FRAME_THRESHOLD = 48;

export class LiveChordTracker {
  private stableNote: string | null = null;
  private frameCount = 0;
  private progression: string[] = [];

  reset(): void {
    this.stableNote = null;
    this.frameCount = 0;
    this.progression = [];
  }

  tick(note: string | null, sessionTonic: string | null): string[] {
    const normalized = note ? normalizeNoteName(note) : null;

    if (!normalized) {
      this.frameCount = 0;
      return this.progression;
    }

    if (normalized === this.stableNote) {
      this.frameCount += 1;
    } else {
      this.stableNote = normalized;
      this.frameCount = 1;
    }

    if (this.frameCount === STABLE_FRAME_THRESHOLD) {
      const entry = formatProgressionEntry(normalized, sessionTonic);
      const last = this.progression[this.progression.length - 1];
      if (last !== entry) {
        this.progression = [...this.progression, entry].slice(-8);
      }
    }

    return this.progression;
  }
}
