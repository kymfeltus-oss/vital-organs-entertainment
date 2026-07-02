import { getSupabaseAdmin } from "@/lib/supabase/server";

type SeedTransactionAmountRow = {
  amount: number | null;
};

/**
 * Calculates a user's real-time seed balance directly from the immutable transaction ledger.
 * @param userId The unique UUID of the user profile.
 */
export async function getUserSeedBalance(userId: string): Promise<number> {
  if (!userId) return 0;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("seed_transactions")
    .select("amount")
    .eq("profile_id", userId);

  if (error) {
    console.error(
      `[SEED_WALLET_ERROR] Failed to fetch ledger entries for user ${userId}:`,
      error,
    );
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  return (data as SeedTransactionAmountRow[]).reduce(
    (sum, transaction) => sum + (transaction.amount ?? 0),
    0,
  );
}
