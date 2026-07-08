import { normalizeNoteName } from "./live-theory";

const SESSION_STABLE_FRAMES = 72;

export class LiveSessionTonicTracker {
  private candidate: string | null = null;
  private frameCount = 0;
  private sessionTonic: string | null = null;

  getTonic(): string | null {
    return this.sessionTonic;
  }

  reset(): void {
    this.candidate = null;
    this.frameCount = 0;
    this.sessionTonic = null;
  }

  tick(note: string | null): string | null {
    const normalized = note ? normalizeNoteName(note) : null;

    if (!normalized) {
      this.frameCount = 0;
      return this.sessionTonic;
    }

    if (normalized === this.candidate) {
      this.frameCount += 1;
    } else {
      this.candidate = normalized;
      this.frameCount = 1;
    }

    if (this.frameCount >= SESSION_STABLE_FRAMES) {
      this.sessionTonic = normalized;
    }

    return this.sessionTonic;
  }
}
