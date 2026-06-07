"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase/client";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function EmailGatePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      window.alert("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabase();

      const { error: attendeeError } = await supabase
        .from("attendees")
        .insert([{ email: trimmedEmail }]);

      if (attendeeError && attendeeError.code !== "23505") {
        throw new Error(attendeeError.message);
      }

      const { error: orderError } = await supabase.from("orders").insert([
        {
          customer_email: trimmedEmail,
          product_id: "live-pass",
          selected_size: "N/A",
          status: "paid",
          stripe_session_id: `dev_bypass_${Date.now()}`,
        },
      ]);

      if (orderError) {
        throw new Error(orderError.message);
      }

      localStorage.setItem("awakening_user_email", trimmedEmail);
      router.push("/dashboard/live");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to complete signup.";
      window.alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#0B090A] px-6 pt-safe pb-safe">
      <form
        onSubmit={handleJoin}
        className="mx-auto flex w-full max-w-md flex-col items-center gap-6"
      >
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            300 Awakening
          </p>
          <h1 className="mt-4 text-xl font-bold uppercase tracking-widest text-white">
            Join The Experience
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            A night of faith. A move of God. A generation awakened.
          </p>
        </header>

        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-2xl border border-white/15 bg-[#111111] px-4 py-4 text-center text-sm text-white outline-none focus:border-[#B0267A] focus:ring-1 focus:ring-[#B0267A] disabled:opacity-60"
        />

        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-gradient-to-r from-[#1E40AF] to-[#B0267A] px-6 py-5 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_35px_rgba(176,38,122,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Unlocking Access..." : "Join The Experience 🙌"}
        </motion.button>
      </form>
    </main>
  );
}
