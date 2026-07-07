import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

/** Browser Supabase client — used by self-service onboarding UI only. */
export const supabase = createBrowserSupabaseClient();
