type MicEngineModule = typeof import("./coleman-mic-engine");

let modulePromise: Promise<MicEngineModule> | null = null;

/** Warm the async mic-engine chunk when any Coleman route mounts. */
export function preloadColemanMicEngine(): Promise<MicEngineModule> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Mic engine preload requires a browser window."));
  }

  if (!modulePromise) {
    modulePromise = import("./coleman-mic-engine");
  }

  return modulePromise;
}

export async function getColemanMicEngineStarter(): Promise<MicEngineModule["startColemanMicEngine"]> {
  const mod = await preloadColemanMicEngine();
  return mod.startColemanMicEngine;
}
