import Link from "next/link";
import { EVENT_START } from "@/lib/countdown";
import { SEED_ECONOMY_PACKS } from "@/lib/merch/catalog";

type GuestDashboardViewProps = {
  userEmail: string;
};

const eventScheduleLabel = EVENT_START.toLocaleString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

export default function GuestDashboardView({ userEmail }: GuestDashboardViewProps) {
  const featuredSeedPack = SEED_ECONOMY_PACKS[0];

  return (
    <main className="min-h-dvh w-full bg-[#0B090A] pt-safe pb-safe text-white">
      <div className="grid w-full grid-cols-1 gap-6 p-6 md:grid-cols-12">
        <header className="md:col-span-12">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            Guest Command Center
          </p>
          <h1 className="mt-2 text-xl font-bold uppercase tracking-widest md:text-2xl">
            Welcome to 300 Awakening
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{userEmail}</p>
        </header>

        <section className="rounded-2xl border border-[#1E40AF]/35 bg-[#111111]/80 p-6 md:col-span-7">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#1E40AF]">
            Event Timeline
          </p>
          <h2 className="mt-3 text-lg font-bold text-white">Live Concert Broadcast</h2>
          <p className="mt-2 text-sm text-zinc-300">{eventScheduleLabel}</p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Your guest session is active. Enter the live interaction hub to watch the
            stream, send emotes, and participate in the Awakening Harvest in real time.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111111]/80 p-6 md:col-span-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-zinc-400">
            Quick Actions
          </p>
          <div className="mt-4 space-y-3">
            <Link
              href="/dashboard/live"
              className="flex w-full items-center justify-center rounded-xl border border-[#1E40AF]/50 bg-[#1E40AF]/15 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-[#1E40AF] hover:bg-[#1E40AF]/25"
            >
              Launch Live Stream Hub
            </Link>
            <Link
              href="/dashboard/merch"
              className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-[#0B090A] px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-zinc-200 transition hover:border-white/30"
            >
              Browse Event Store
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[#B0267A]/35 bg-gradient-to-br from-[#B0267A]/10 to-[#1E40AF]/10 p-6 md:col-span-12">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#B0267A]">
            Unlock Permanent Records
          </p>
          <h2 className="mt-2 text-lg font-bold text-white">
            Register or grab a Seed Pack
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            Create a full profile to preserve your concert receipts, seed wallet, and
            personalized dashboard history across every Awakening event.
          </p>
          {featuredSeedPack && (
            <p className="mt-3 text-sm text-zinc-400">
              Featured bundle: {featuredSeedPack.title} —{" "}
              {featuredSeedPack.seedAmount.toLocaleString("en-US")} seeds
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/email-gate?next=/dashboard"
              className="rounded-full border border-[#B0267A]/50 bg-[#B0267A]/15 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-[#B0267A]"
            >
              Create Full Account
            </Link>
            <Link
              href="/dashboard/live"
              className="rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/15 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-[#1E40AF]"
            >
              Get Seed Pack in Live Room
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
