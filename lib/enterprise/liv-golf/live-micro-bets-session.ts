import type { LiveMicroBetsSession } from "@/lib/liv-micro-bets";
import { mapLiveMicroBetsSessionRow } from "@/lib/liv-micro-bets";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type LiveMicroBetsSessionRow = {
  id: string;
  active_bet_id: string | null;
  clear_overlays: boolean;
  launched_at: string | null;
  updated_at: string;
  updated_by: string | null;
};

const TABLE = "live_micro_bets_session";
const SESSION_ID = "current";

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
    .select("id, active_bet_id, clear_overlays, launched_at, updated_at, updated_by")
    .eq("id", SESSION_ID)
    .maybeSingle();

  if (error) {
    if (isMissingSessionTable(error)) {
      throw new LiveMicroBetsSessionUnavailableError(errorMessage(error));
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
}): Promise<LiveMicroBetsSession> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from(TABLE)
    .upsert({
      id: SESSION_ID,
      active_bet_id: input.activeBetId,
      clear_overlays: input.clearOverlays,
      launched_at: input.activeBetId ? now : null,
      updated_at: now,
      updated_by: input.updatedBy,
    })
    .select("id, active_bet_id, clear_overlays, launched_at, updated_at, updated_by")
    .single();

  if (error) {
    if (isMissingSessionTable(error)) {
      throw new LiveMicroBetsSessionUnavailableError(errorMessage(error));
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
