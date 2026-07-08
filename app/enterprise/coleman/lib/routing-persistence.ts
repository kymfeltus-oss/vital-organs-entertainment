export type RoutingSelectedMode = "SPEAKER" | "HEADPHONES";
export type RoutingInputSource = "ACOUSTIC_AIR" | "DIRECT_LINE" | "WIFI_STREAM";

export type AudioRoutingConfigRecord = {
  id: string;
  userId: string;
  selectedMode: RoutingSelectedMode;
  inputSource: RoutingInputSource;
  noiseGateDb: number;
  lowPassCutoffHz: number;
  latencyOffsetMs: number;
  updatedAt: string;
};

export type AudioRoutingConfigWrite = {
  userId?: string;
  selectedMode?: RoutingSelectedMode;
  inputSource?: RoutingInputSource;
  noiseGateDb?: number;
  lowPassCutoffHz?: number;
  latencyOffsetMs?: number;
};

const SELECTED_MODES = new Set<RoutingSelectedMode>(["SPEAKER", "HEADPHONES"]);
const INPUT_SOURCES = new Set<RoutingInputSource>([
  "ACOUSTIC_AIR",
  "DIRECT_LINE",
  "WIFI_STREAM",
]);

export const DEFAULT_ROUTING_USER_ID = "global_session_user";

export function resolveRoutingUserId(raw: string | null | undefined): string {
  const trimmed = raw?.trim();
  return trimmed || DEFAULT_ROUTING_USER_ID;
}

export function lowPassForInputSource(inputSource: RoutingInputSource): number {
  return inputSource === "ACOUSTIC_AIR" ? 800 : 20000;
}

export function labelForInputSource(inputSource: RoutingInputSource): string {
  switch (inputSource) {
    case "DIRECT_LINE":
      return "Audio Interface Line";
    case "WIFI_STREAM":
      return "Digital Wi-Fi Console";
    default:
      return "Internal Room Mic";
  }
}

export function validateRoutingWrite(body: unknown): {
  ok: true;
  value: Required<Pick<AudioRoutingConfigWrite, "userId">> & AudioRoutingConfigWrite;
} | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body is required." };
  }

  const record = body as Record<string, unknown>;
  const userId = resolveRoutingUserId(
    typeof record.userId === "string" ? record.userId : undefined,
  );

  if (record.selectedMode !== undefined) {
    if (typeof record.selectedMode !== "string" || !SELECTED_MODES.has(record.selectedMode as RoutingSelectedMode)) {
      return { ok: false, error: "Invalid output routing mode." };
    }
  }

  if (record.inputSource !== undefined) {
    if (typeof record.inputSource !== "string" || !INPUT_SOURCES.has(record.inputSource as RoutingInputSource)) {
      return { ok: false, error: "Invalid capture input source." };
    }
  }

  if (record.noiseGateDb !== undefined) {
    const noiseGateDb = Number(record.noiseGateDb);
    if (!Number.isFinite(noiseGateDb) || noiseGateDb < -160 || noiseGateDb > 0) {
      return { ok: false, error: "Noise gate threshold bounds configuration out of range." };
    }
  }

  if (record.latencyOffsetMs !== undefined) {
    const latencyOffsetMs = Number(record.latencyOffsetMs);
    if (!Number.isInteger(latencyOffsetMs) || latencyOffsetMs < 0 || latencyOffsetMs > 500) {
      return { ok: false, error: "Latency offset constraints maximum exceeded." };
    }
  }

  if (record.lowPassCutoffHz !== undefined) {
    const lowPassCutoffHz = Number(record.lowPassCutoffHz);
    if (!Number.isFinite(lowPassCutoffHz) || lowPassCutoffHz < 80 || lowPassCutoffHz > 20000) {
      return { ok: false, error: "Low-pass cutoff is out of supported range." };
    }
  }

  return {
    ok: true,
    value: {
      userId,
      selectedMode: record.selectedMode as RoutingSelectedMode | undefined,
      inputSource: record.inputSource as RoutingInputSource | undefined,
      noiseGateDb: record.noiseGateDb !== undefined ? Number(record.noiseGateDb) : undefined,
      lowPassCutoffHz:
        record.lowPassCutoffHz !== undefined ? Number(record.lowPassCutoffHz) : undefined,
      latencyOffsetMs:
        record.latencyOffsetMs !== undefined ? Number(record.latencyOffsetMs) : undefined,
    },
  };
}

export function serializeRoutingConfig(row: {
  id: string;
  userId: string;
  selectedMode: string;
  inputSource: string;
  noiseGateDb: number;
  lowPassCutoffHz: number;
  latencyOffsetMs: number;
  updatedAt: Date;
}): AudioRoutingConfigRecord {
  return {
    id: row.id,
    userId: row.userId,
    selectedMode: row.selectedMode as RoutingSelectedMode,
    inputSource: row.inputSource as RoutingInputSource,
    noiseGateDb: row.noiseGateDb,
    lowPassCutoffHz: row.lowPassCutoffHz,
    latencyOffsetMs: row.latencyOffsetMs,
    updatedAt: row.updatedAt.toISOString(),
  };
}
