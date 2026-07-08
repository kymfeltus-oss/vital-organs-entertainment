/// <reference lib="webworker" />

import { analyzePitchBuffer } from "./pitch-core";

export type PitchWorkerIn = {
  type: "analyze";
  buffer: Float32Array;
  sampleRate: number;
};

export type PitchWorkerOut = {
  type: "frame";
  currentKey: string | null;
  currentCents: number;
};

self.onmessage = (event: MessageEvent<PitchWorkerIn>) => {
  if (event.data.type !== "analyze") {
    return;
  }

  const frame = analyzePitchBuffer(event.data.buffer, event.data.sampleRate);
  const message: PitchWorkerOut = { type: "frame", ...frame };
  self.postMessage(message);
};
