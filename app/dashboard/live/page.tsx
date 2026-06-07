"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Hls from "hls.js";
import { getSupabase } from "@/lib/supabase/client";

const HLS_STREAM_URL =
  process.env.NEXT_PUBLIC_HLS_STREAM_URL ??
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

const HARVEST_GOAL_DOLLARS = 30_000;
const ARTWORK_SRC = "/logo.png";

const QUICK_GIFTS = [
  { label: "🔥 Drop $10 Seed", cents: 1000 },
  { label: "🙌 Sow $25 Blessing", cents: 2500 },
  { label: "🙏 Unleash $50 Breakthrough", cents: 5000 },
] as const;

const REACTION_EMOJIS = ["🔥", "🙌", "🙏", "😭"] as const;

type FloatingEmoji = {
  id: string;
  emoji: string;
  leftPercent: number;
};

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function formatCurrency(dollars: number): string {
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

async function sumPaidDonationsDollars(): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("donations")
    .select("amount_cents")
    .eq("status", "paid");

  if (error) {
    console.error("Failed to load donation total:", error.message);
    return 0;
  }

  const totalCents = (data ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0,
  );
  return totalCents / 100;
}

function LiveRoomContent() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [hasTicket, setHasTicket] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStreamLive, setIsStreamLive] = useState(false);
  const [totalRaised, setTotalRaised] = useState(0);
  const [submittingCents, setSubmittingCents] = useState<number | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [chatDraft, setChatDraft] = useState("");

  const progressPercent = Math.min(
    100,
    (totalRaised / HARVEST_GOAL_DOLLARS) * 100,
  );

  const refreshDonationTotal = useCallback(async () => {
    try {
      const total = await sumPaidDonationsDollars();
      setTotalRaised(total);
    } catch (error) {
      console.error("Donation total refresh error:", error);
    }
  }, []);

  const verifyTicketAccess = useCallback(async () => {
    setIsLoading(true);

    const userEmail = localStorage.getItem("awakening_user_email");

    if (!userEmail) {
      setHasTicket(false);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_email", userEmail)
        .eq("product_id", "live-pass")
        .eq("status", "paid");

      if (error) {
        console.error("Ticket verification failed:", error.message);
        setHasTicket(false);
        setIsLoading(false);
        return;
      }

      setHasTicket(Array.isArray(data) && data.length > 0);
    } catch (error) {
      console.error("Ticket verification error:", error);
      setHasTicket(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const returnedFromCheckout = searchParams.get("success") === "true";

    async function runVerificationWithRetry() {
      const attempts = returnedFromCheckout ? 5 : 1;

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (cancelled) return;

        await verifyTicketAccess();

        if (returnedFromCheckout && attempt < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (returnedFromCheckout && !cancelled) {
        window.history.replaceState({}, "", "/dashboard/live");
      }
    }

    void runVerificationWithRetry();

    return () => {
      cancelled = true;
    };
  }, [searchParams, verifyTicketAccess]);

  useEffect(() => {
    if (!hasTicket) return;

    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch {
      return;
    }

    const channel = supabase
      .channel("public:donations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "donations" },
        (payload) => {
          const row = payload.new as { status?: string };
          if (row.status === "paid") {
            void refreshDonationTotal();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "donations" },
        (payload) => {
          const row = payload.new as { status?: string };
          if (row.status === "paid") {
            void refreshDonationTotal();
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void refreshDonationTotal();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hasTicket, refreshDonationTotal]);

  useEffect(() => {
    const video = videoRef.current;

    if (!hasTicket || !video || !HLS_STREAM_URL) {
      return;
    }

    const markLive = () => setIsStreamLive(true);
    const markOffline = () => setIsStreamLive(false);

    video.addEventListener("playing", markLive);
    video.addEventListener("error", markOffline);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_STREAM_URL;
      return () => {
        video.removeEventListener("playing", markLive);
        video.removeEventListener("error", markOffline);
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(HLS_STREAM_URL);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, markLive);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          markOffline();
        }
      });

      return () => {
        hls.off(Hls.Events.MANIFEST_PARSED, markLive);
        hls.destroy();
        hlsRef.current = null;
        video.removeEventListener("playing", markLive);
        video.removeEventListener("error", markOffline);
      };
    }

    return () => {
      video.removeEventListener("playing", markLive);
      video.removeEventListener("error", markOffline);
    };
  }, [hasTicket]);

  const handleGetVirtualTicket = useCallback(async () => {
    const customerEmail = localStorage.getItem("awakening_user_email");

    if (!customerEmail) {
      window.alert(
        "We need your email on file before checkout. Please complete the email gate first.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${getAppUrl()}/api/checkout/merch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "live-pass",
          selectedSize: "N/A",
          customerEmail,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        window.alert(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      window.alert("Unable to reach checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleQuickGift = useCallback(async (amountInCents: number) => {
    const customerEmail = localStorage.getItem("awakening_user_email");

    if (!customerEmail) {
      window.alert(
        "We need your email on file before giving. Please complete the email gate first.",
      );
      return;
    }

    setSubmittingCents(amountInCents);

    try {
      const response = await fetch(`${getAppUrl()}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountInCents, customerEmail }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        window.alert(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      window.alert("Unable to reach checkout. Please try again.");
    } finally {
      setSubmittingCents(null);
    }
  }, []);

  const spawnFloatingEmoji = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const leftPercent = 15 + Math.random() * 70;

    setFloatingEmojis((current) => [...current, { id, emoji, leftPercent }]);
  }, []);

  const removeFloatingEmoji = useCallback((id: string) => {
    setFloatingEmojis((current) => current.filter((item) => item.id !== id));
  }, []);

  if (isLoading || hasTicket === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B090A] px-6 pt-safe pb-safe text-white">
        <div className="mx-auto w-full max-w-md text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            Live Room
          </p>
          <p className="mt-6 text-sm text-zinc-400">Verifying your access pass...</p>
          <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-2 border-[#1E40AF] border-t-transparent" />
        </div>
      </main>
    );
  }

  if (hasTicket) {
    return (
      <main className="flex min-h-dvh w-full flex-col bg-[#0B090A] pt-safe pb-safe text-white">
        <div className="mx-auto flex h-dvh w-full max-w-md flex-col">
          <header className="shrink-0 px-4 py-3 text-center">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
              Live Interaction Hub
            </p>
            <h1 className="mt-1 text-base font-bold uppercase tracking-widest text-white">
              300 Awakening Live
            </h1>
          </header>

          <div
            ref={videoContainerRef}
            className="relative mx-4 h-[50dvh] min-h-[220px] shrink-0 overflow-hidden rounded-2xl border border-[#1E40AF]/40 bg-black shadow-[0_0_30px_rgba(30,64,175,0.25)]"
          >
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full object-cover ${
                isStreamLive ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              controls={isStreamLive}
              playsInline
              autoPlay
              muted
            />

            {!isStreamLive && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0B090A]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ARTWORK_SRC}
                  alt="300 Awakening event artwork"
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B090A] via-transparent to-[#0B090A]/40" />
                <motion.span
                  animate={{ opacity: [1, 0.45, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full border border-red-500/60 bg-red-600/20 px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.45)]"
                >
                  ● Live Tonight 7:30 PM CST
                </motion.span>
              </div>
            )}

            <AnimatePresence>
              {floatingEmojis.map((item) => (
                <motion.span
                  key={item.id}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: -200, opacity: 0, scale: 1.35 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  onAnimationComplete={() => removeFloatingEmoji(item.id)}
                  className="pointer-events-none absolute bottom-6 z-20 text-3xl"
                  style={{ left: `${item.leftPercent}%` }}
                >
                  {item.emoji}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          <section className="mx-4 mt-4 shrink-0">
            <p className="text-center text-[0.6rem] font-bold uppercase tracking-[0.22em] text-zinc-300">
              Awakening Harvest Progress: {formatCurrency(totalRaised)} /{" "}
              {formatCurrency(HARVEST_GOAL_DOLLARS)}
            </p>
            <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/10 bg-[#111111]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#1E40AF] to-[#B0267A] shadow-[0_0_16px_rgba(176,38,122,0.55)]"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
          </section>

          <div className="mx-4 mt-4 shrink-0 overflow-x-auto">
            <div className="flex min-w-max gap-2 pb-1">
              {QUICK_GIFTS.map((gift) => (
                <motion.button
                  key={gift.cents}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  disabled={submittingCents !== null}
                  onClick={() => void handleQuickGift(gift.cents)}
                  className="shrink-0 rounded-full border border-[#1E40AF]/50 bg-[#111111] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_18px_rgba(30,64,175,0.25)] transition hover:border-[#B0267A]/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingCents === gift.cents ? "Launching..." : gift.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mt-auto shrink-0 border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              {REACTION_EMOJIS.map((emoji) => (
                <motion.button
                  key={emoji}
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={() => spawnFloatingEmoji(emoji)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#111111] text-lg transition hover:border-[#B0267A]/50"
                  aria-label={`Send ${emoji} reaction`}
                >
                  {emoji}
                </motion.button>
              ))}
              <input
                type="text"
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Send love to the choir..."
                className="min-w-0 flex-1 rounded-full border border-white/15 bg-[#111111] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B090A] px-6 pt-safe pb-safe text-white">
      <div className="mx-auto w-full max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
          Live Room
        </p>
        <h1 className="mt-4 text-2xl font-bold uppercase tracking-widest text-white">
          Virtual Access Required
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Purchase your $10 live stream ticket to unlock the concert feed.
        </p>
      </div>

      <article className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-[#1E40AF]/50 bg-[#111111] p-6 shadow-[0_0_30px_rgba(30,64,175,0.25)]">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
          Stream The Awakening Live 📺
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Can&apos;t make it to Faith Kingdom Church in person? Get full digital
          access to watch the 300 Choir live on your phone for only $10.
        </p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleGetVirtualTicket}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#1E40AF] to-[#B0267A] px-6 py-5 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_35px_rgba(176,38,122,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Preparing Checkout..." : "Get Virtual Ticket 🎟️"}
        </motion.button>
      </article>
    </main>
  );
}

export default function LiveRoomPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0B090A] text-zinc-400">
          Loading Live Room...
        </main>
      }
    >
      <LiveRoomContent />
    </Suspense>
  );
}
