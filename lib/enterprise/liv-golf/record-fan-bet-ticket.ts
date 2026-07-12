import type { SupabaseClient } from "@supabase/supabase-js";

export type FanBetTicketInsert = {
  roomId: string;
  betId: string;
  userId: string;
  selection: "Yes" | "No";
  stake: number;
  payout: number;
};

export class FanBetTicketUnavailableError extends Error {
  constructor(message = "fan_bet_tickets table is unavailable.") {
    super(message);
    this.name = "FanBetTicketUnavailableError";
  }
}

function isMissingTicketsTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  return (
    code === "PGRST205" ||
    /fan_bet_tickets|does not exist|Could not find the table|schema cache|42P01|PGRST205/i.test(
      message,
    )
  );
}

/** Persist a fan wager ticket row for downstream atomic resolution. */
export async function recordFanBetTicket(
  admin: SupabaseClient,
  ticket: FanBetTicketInsert,
): Promise<void> {
  const { error } = await admin.from("fan_bet_tickets").upsert(
    {
      room_id: ticket.roomId,
      bet_id: ticket.betId,
      user_id: ticket.userId,
      selection: ticket.selection,
      stake: ticket.stake,
      payout: ticket.payout,
      status: "open",
      resolved_at: null,
    },
    { onConflict: "room_id,bet_id,user_id" },
  );

  if (error) {
    if (isMissingTicketsTable(error)) {
      throw new FanBetTicketUnavailableError();
    }
    throw new Error(error.message);
  }
}
