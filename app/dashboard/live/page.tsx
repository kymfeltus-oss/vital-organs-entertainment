"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Hls from "hls.js";
import { getSupabase } from "@/lib/supabase/client";

const HLS_STREAM_URL =
  process.env.NEXT_PUBLIC_HLS_STREAM_URL ??
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

function LiveRoomContent() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [hasTicket, setHasTicket] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const video = videoRef.current;

    if (!hasTicket || !video || !HLS_STREAM_URL) {
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_STREAM_URL;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(HLS_STREAM_URL);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/checkout/merch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: "live-pass",
            selectedSize: "N/A",
            customerEmail,
          }),
        },
      );

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
      <main className="min-h-screen w-full bg-black pt-safe pb-safe">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#0B090A]">
          <header className="px-6 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
              Live Room
            </p>
            <h1 className="mt-2 text-lg font-bold uppercase tracking-widest text-white">
              300 Awakening Live
            </h1>
          </header>

          <div className="flex flex-1 flex-col px-4 pb-6">
            <div className="overflow-hidden rounded-2xl border border-[#1E40AF]/40 bg-black shadow-[0_0_30px_rgba(30,64,175,0.25)]">
              <video
                ref={videoRef}
                className="aspect-video w-full bg-black object-contain"
                controls
                playsInline
                autoPlay
              />
            </div>
            <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">
              Virtual access granted — enjoy the live stream
            </p>
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
