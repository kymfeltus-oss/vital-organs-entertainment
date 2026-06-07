"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailGatePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const { error: insertError } = await supabase
      .from("attendees")
      .insert([{ email: trimmedEmail }]);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem("awakening_user_email", trimmedEmail);
    router.push("/dashboard/live");
  };

  return (
    <main className="flex h-screen min-h-screen w-screen items-center justify-center bg-[#0B090A]">
      <div className="relative flex h-full w-full max-w-md flex-col justify-between overflow-hidden p-6 md:h-[85vh] md:rounded-3xl md:border md:border-zinc-800/40 md:shadow-2xl">
        <section className="flex flex-col items-center pt-safe text-center">
          <div className="mt-6 flex w-full justify-center">
            <img
              src="/logo.png"
              alt="300 Awakening"
              className="w-[72vw] max-w-[280px] drop-shadow-[0_0_45px_rgba(255,0,180,0.85)]"
            />
          </div>

          <p className="mt-8 max-w-xs text-xs font-bold uppercase leading-relaxed tracking-[0.28em] text-white">
            A NIGHT OF FAITH. A MOVE OF GOD. A GENERATION AWAKENED.
          </p>
        </section>

        <section className="flex flex-1 flex-col items-center justify-center px-1">
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-sm flex-col items-center gap-5"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address to enter the experience..."
              autoComplete="email"
              className="w-full rounded-2xl border border-zinc-700/80 bg-[#121014] px-5 py-4 text-center text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#B0267A] focus:ring-1 focus:ring-[#B0267A]"
            />

            {error && (
              <p className="text-center text-xs text-[#ff6eb4]" role="alert">
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl bg-gradient-to-b from-cyan-400 to-purple-600 px-6 py-5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_0_35px_rgba(0,220,255,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "JOINING..." : "JOIN THE EXPERIENCE 🙌"}
            </motion.button>
          </form>
        </section>

        <div aria-hidden="true" className="pb-safe" />
      </div>
    </main>
  );
}
