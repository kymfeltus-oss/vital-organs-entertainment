export type TimeSignature = "4/4" | "3/4" | "6/8";

const SCHEDULE_AHEAD_SEC = 0.12;
const LOOK_AHEAD_MS = 25;

export function beatsPerBar(timeSignature: TimeSignature): number {
  switch (timeSignature) {
    case "3/4":
      return 3;
    case "6/8":
      return 6;
    default:
      return 4;
  }
}

export function isDownbeat(beatIndex: number, timeSignature: TimeSignature): boolean {
  if (timeSignature === "6/8") {
    return beatIndex === 0 || beatIndex === 3;
  }
  return beatIndex === 0;
}

export type MetronomeEngineHandle = {
  start: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setTimeSignature: (timeSignature: TimeSignature) => void;
  dispose: () => void;
};

export function createMetronomeEngine(): MetronomeEngineHandle {
  let context: AudioContext | null = null;
  let timerId: number | null = null;
  let nextNoteTime = 0;
  let currentBeat = 0;
  let bpm = 120;
  let timeSignature: TimeSignature = "4/4";
  let running = false;

  const secondsPerBeat = () => 60 / bpm;

  const playClick = (accent: boolean) => {
    if (!context) {
      return;
    }

    const time = nextNoteTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = accent ? 1200 : 880;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.22 : 0.14, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.05);
  };

  const scheduleNotes = () => {
    if (!context || !running) {
      return;
    }

    const beats = beatsPerBar(timeSignature);

    while (nextNoteTime < context.currentTime + SCHEDULE_AHEAD_SEC) {
      playClick(isDownbeat(currentBeat, timeSignature));
      nextNoteTime += secondsPerBeat();
      currentBeat = (currentBeat + 1) % beats;
    }
  };

  const ensureContext = async () => {
    if (!context) {
      context = new AudioContext({ latencyHint: "interactive" });
    }
    if (context.state === "suspended") {
      await context.resume();
    }
  };

  const start = () => {
    void (async () => {
      await ensureContext();
      if (!context || running) {
        return;
      }

      running = true;
      currentBeat = 0;
      nextNoteTime = context.currentTime + 0.05;

      timerId = window.setInterval(() => {
        scheduleNotes();
      }, LOOK_AHEAD_MS);
    })();
  };

  const stop = () => {
    running = false;
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    currentBeat = 0;
  };

  const setBpm = (nextBpm: number) => {
    bpm = Math.max(40, Math.min(220, Math.round(nextBpm)));
  };

  const setTimeSignature = (signature: TimeSignature) => {
    timeSignature = signature;
    currentBeat = 0;
  };

  const dispose = () => {
    stop();
    void context?.close();
    context = null;
  };

  return {
    start,
    stop,
    setBpm,
    setTimeSignature,
    dispose,
  };
}

export function averageTapBpm(tapTimesMs: number[], minBpm = 40, maxBpm = 220): number | null {
  if (tapTimesMs.length < 2) {
    return null;
  }

  const intervals: number[] = [];
  for (let i = 1; i < tapTimesMs.length; i += 1) {
    intervals.push(tapTimesMs[i] - tapTimesMs[i - 1]);
  }

  const recent = intervals.slice(-4);
  const averageMs = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  if (averageMs <= 0) {
    return null;
  }

  const bpm = Math.round(60000 / averageMs);
  return Math.max(minBpm, Math.min(maxBpm, bpm));
}
