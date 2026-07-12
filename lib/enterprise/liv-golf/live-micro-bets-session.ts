import type { LiveMicroBetsSession, MicroBetSessionPhase } from "@/lib/liv-micro-bets";
import { mapLiveMicroBetsSessionRow } from "@/lib/liv-micro-bets";
import {
  computeShowcaseEndsAt,
  findLegendaryShowcaseScenario,
} from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type LiveMicroBetsSessionRow = {
  id: string;
  active_bet_id: string | null;
  clear_overlays: boolean;
  launched_at: string | null;
  updated_at: string;
  updated_by: string | null;
  phase?: string | null;
  ends_at?: string | null;
  resolved_winner?: string | null;
};

const TABLE = "live_micro_bets_session";
const SESSION_ID = "current";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SESSION_COLUMNS =
  "id, active_bet_id, clear_overlays, launched_at, updated_at, updated_by, phase, ends_at, resolved_winner";

function resolveSessionUpdatedBy(userId: string): string | null {
  return UUID_PATTERN.test(userId) ? userId : null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function isMissingSessionTable(error: unknown): boolean {
  const message = errorMessage(error);
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  return (
    code === "PGRST205" ||
    /live_micro_bets_session|does not exist|Could not find the table|schema cache|42P01|PGRST205/i.test(
      message,
    )
  );
}

function isMissingPhaseColumn(error: unknown): boolean {
  const message = errorMessage(error);
  return /phase|ends_at|resolved_winner|column/i.test(message);
}

function resolveLaunchEndsAt(activeBetId: string, launchedAt: string): string | null {
  const showcase = findLegendaryShowcaseScenario(activeBetId);
  if (showcase) {
    return computeShowcaseEndsAt(showcase, launchedAt);
  }

  const end = new Date(launchedAt);
  end.setSeconds(end.getSeconds() + 30);
  return end.toISOString();
}

export class LiveMicroBetsSessionUnavailableError extends Error {
  constructor(message = "live_micro_bets_session table is unavailable.") {
    super(message);
    this.name = "LiveMicroBetsSessionUnavailableError";
  }
}

export async function loadLiveMicroBetsSession(): Promise<LiveMicroBetsSession | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(TABLE)
    .select(SESSION_COLUMNS)
    .eq("id", SESSION_ID)
    .maybeSingle();

  if (error) {
    if (isMissingSessionTable(error)) {
      throw new LiveMicroBetsSessionUnavailableError(errorMessage(error));
    }

    if (isMissingPhaseColumn(error)) {
      const legacy = await admin
        .from(TABLE)
        .select("id, active_bet_id, clear_overlays, launched_at, updated_at, updated_by")
        .eq("id", SESSION_ID)
        .maybeSingle();

      if (legacy.error) throw new Error(errorMessage(legacy.error));
      if (!legacy.data) return null;

      return mapLiveMicroBetsSessionRow(legacy.data as LiveMicroBetsSessionRow);
    }

    throw new Error(errorMessage(error));
  }

  if (!data) return null;
  return mapLiveMicroBetsSessionRow(data as LiveMicroBetsSessionRow);
}

export async function upsertLiveMicroBetsSession(input: {
  activeBetId: string | null;
  clearOverlays: boolean;
  updatedBy: string;
  phase?: MicroBetSessionPhase;
  endsAt?: string | null;
  resolvedWinner?: "Yes" | "No" | null;
  preserveLaunchedAt?: boolean;
  launchedAt?: string | null;
}): Promise<LiveMicroBetsSession> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const isLaunch = Boolean(input.activeBetId);

  let launchedAt: string | null = null;
  if (isLaunch) {
    if (input.preserveLaunchedAt && input.launchedAt) {
      launchedAt = input.launchedAt;
    } else if (input.preserveLaunchedAt) {
      const existing = await loadLiveMicroBetsSession();
      launchedAt = existing?.launchedAt ?? now;
    } else {
      launchedAt = now;
    }
  }

  const endsAt =
    input.endsAt !== undefined
      ? input.endsAt
      : isLaunch && launchedAt
        ? resolveLaunchEndsAt(input.activeBetId!, launchedAt)
        : null;

  const row = {
    id: SESSION_ID,
    active_bet_id: input.activeBetId,
    clear_overlays: input.clearOverlays,
    launched_at: launchedAt ?? (isLaunch ? now : null),
    updated_at: now,
    updated_by: resolveSessionUpdatedBy(input.updatedBy),
    phase: input.phase ?? (isLaunch ? "OPEN" : "RESOLVED"),
    ends_at: isLaunch ? endsAt : null,
    resolved_winner: input.resolvedWinner ?? null,
  };

  const { data, error } = await admin
    .from(TABLE)
    .upsert(row)
    .select(SESSION_COLUMNS)
    .single();

  if (error) {
    if (isMissingSessionTable(error)) {
      throw new LiveMicroBetsSessionUnavailableError(errorMessage(error));
    }

    if (isMissingPhaseColumn(error)) {
      const legacyRow = {
        id: SESSION_ID,
        active_bet_id: input.activeBetId,
        clear_overlays: input.clearOverlays,
        launched_at: launchedAt ?? (isLaunch ? now : null),
        updated_at: now,
        updated_by: resolveSessionUpdatedBy(input.updatedBy),
      };

      const legacy = await admin
        .from(TABLE)
        .upsert(legacyRow)
        .select("id, active_bet_id, clear_overlays, launched_at, updated_at, updated_by")
        .single();

      if (legacy.error) throw new Error(errorMessage(legacy.error));
      return mapLiveMicroBetsSessionRow(legacy.data as LiveMicroBetsSessionRow);
    }

    throw new Error(errorMessage(error));
  }

  return mapLiveMicroBetsSessionRow(data as LiveMicroBetsSessionRow);
}

export async function countLivMicroBetPlacements(): Promise<number> {
  const admin = getSupabaseAdmin();
  const { count, error } = await admin
    .from("seed_transactions")
    .select("id", { count: "exact", head: true })
    .eq("transaction_type", "liv_micro_bet");

  if (error) {
    if (/seed_transactions|does not exist|Could not find the table|schema cache/i.test(error.message)) {
      return 0;
    }
    throw new Error(errorMessage(error));
  }

  return count ?? 0;
}
