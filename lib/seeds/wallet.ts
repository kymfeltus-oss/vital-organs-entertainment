import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Reads the authoritative spendable balance used by purchase and sow RPCs.
 * @param userId The unique UUID of the user profile.
 */
export async function getUserSeedBalance(userId: string): Promise<number> {
  if (!userId) return 0;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("seed_wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      `[SEED_WALLET_ERROR] Failed to fetch wallet for user ${userId}:`,
      error,
    );
    return 0;
  }

  return data?.balance ?? 0;
}
