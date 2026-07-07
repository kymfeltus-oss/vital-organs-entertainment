import { headers } from "next/headers";
import { getTenantTheme } from "@/lib/theme/tenant-resolver";
import IntroMediaSplash from "@/components/features/intro/IntroMediaSplash";

export default async function RootPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get("x-tenant-id");

  const hasActiveTenantSubdomain = (id: string | null) => {
    return id && id !== "" && id !== "default";
  };

  if (hasActiveTenantSubdomain(tenantId)) {
    const theme = await getTenantTheme(tenantId!);
    return (
      <main className="min-h-screen w-full bg-black">
        <IntroMediaSplash tenantTheme={theme} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white selection:bg-[#00f2ff] selection:text-black">
      <header className="mx-auto max-w-7xl px-6 pb-16 pt-24 text-center">
        <div className="mb-6 inline-block rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#00f2ff]">
          Next-Generation Media Infrastructure
        </div>
        <h1 className="mb-6 bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-5xl font-extrabold leading-none tracking-tight text-transparent md:text-7xl">
          Launch Your Own Branded <br />
          Streaming Network
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-neutral-400 md:text-lg">
          Deploy an independent, secure live entertainment platform with integrated monetization,
          real-time engagement tools, and customized mobile web app wrappers.
        </p>
        <a
          href="/onboarding"
          className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-semibold text-black shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Build Your Network
        </a>
      </header>

      <section className="mx-auto max-w-6xl border-t border-neutral-900 px-6 py-12">
        <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-neutral-200">
          Engineered Platform Foundations
        </h2>
        <div className="grid gap-8 text-sm md:grid-cols-3">
          <div className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-6">
            <div className="mb-2 text-lg font-bold text-[#00f2ff]">⚡️ Production Control Plane</div>
            <p className="leading-relaxed text-neutral-400">
              Owner production cockpits, live preflight checks, phase routing (holding room → live
              experience), and custom OBS/vMix overlay graphics injection.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-6">
            <div className="mb-2 text-lg font-bold text-[#00f2ff]">💬 Fellowship Chat & Reactions</div>
            <p className="leading-relaxed text-neutral-400">
              Real-time audience messaging, rate-limited emoji burst tracking, display presence
              smoothing, and integrated global giving/prayer panels.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-6">
            <div className="mb-2 text-lg font-bold text-[#00f2ff]">🪙 In-Stream Token Economy</div>
            <p className="leading-relaxed text-neutral-400">
              Vital Seed digital wallet tracking, one-tap seed gifting with automatic chat
              announcements, and signature-verified Postgres RPC checkout fulfillment.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-neutral-900 px-6 py-16">
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
          Choose Your Deployment Scale
        </h2>
        <p className="mb-12 text-center text-sm text-neutral-400">
          Every tier features isolated database multi-tenancy frameworks.
        </p>

        <div className="grid items-stretch gap-8 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-neutral-900 bg-neutral-900/40 p-8">
            <div>
              <h3 className="mb-1 text-xl font-bold">Starter</h3>
              <p className="mb-6 text-xs text-neutral-400">For independent solo creators.</p>
              <div className="my-4 h-px bg-neutral-900" />
              <ul className="space-y-3.5 text-xs text-neutral-300">
                <li className="flex items-start gap-2 font-medium text-neutral-200">
                  ✓ Shared platform web domain link
                </li>
                <li className="flex items-start gap-2">✓ 720p HD live video player</li>
                <li className="flex items-start gap-2">✓ Fellowship Chat (1 active room)</li>
                <li className="flex items-start gap-2">✓ Cinematic intro splash route</li>
                <li className="flex items-start gap-2">✓ Email gate user capture panels</li>
                <li className="flex items-start gap-2">✓ Vital Seed gifting & giving sheets</li>
                <li className="flex items-start gap-2">✓ Automated PWA mobile deployment</li>
                <li className="flex items-start gap-2">✓ Core color & title theme setups</li>
              </ul>
            </div>
            <a
              href="/onboarding?tier=starter"
              className="mt-8 w-full rounded-md bg-neutral-800 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-neutral-700"
            >
              Request Access / Start Trial
            </a>
          </div>

          <div className="relative flex flex-col justify-between rounded-xl border-2 border-[#00f2ff] bg-neutral-900 p-8 shadow-[0_0_40px_rgba(0,242,255,0.06)]">
            <span className="absolute -top-3 right-6 rounded-full bg-[#00f2ff] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-black">
              Popular
            </span>
            <div>
              <h3 className="mb-1 text-xl font-bold">Network Pro</h3>
              <p className="mb-6 text-xs text-[#00f2ff]">For emerging media brands.</p>
              <div className="my-4 h-px bg-neutral-900" />
              <ul className="space-y-3.5 text-xs text-neutral-200">
                <li className="flex items-start gap-2 font-bold text-white">
                  ✓ Custom Mapping (yourbrand.com)
                </li>
                <li className="flex items-start gap-2 font-semibold">
                  ✓ Crystal clear 1080p stream matrix
                </li>
                <li className="flex items-start gap-2">✓ 5 simultaneous live chat rooms</li>
                <li className="flex items-start gap-2">✓ Dynamic studio theme color pickers</li>
                <li className="flex items-start gap-2">✓ Feature visibility toggle controls</li>
                <li className="flex items-start gap-2">✓ vMix API & overlay graphics injection</li>
                <li className="flex items-start gap-2">
                  ✓ Pre-show holding room + countdown layouts
                </li>
                <li className="flex items-start gap-2">✓ Stripe seed bundles & donations setup</li>
                <li className="flex items-start gap-2">✓ Real-time studio sandbox previews</li>
              </ul>
            </div>
            <a
              href="/onboarding?tier=pro"
              className="mt-8 w-full rounded-md bg-[#00f2ff] py-2.5 text-center text-sm font-bold text-black shadow-[0_0_20px_rgba(0,242,255,0.2)] transition-opacity hover:opacity-90"
            >
              Request Access / Start Trial
            </a>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-neutral-900 bg-neutral-900/40 p-8">
            <div>
              <h3 className="mb-1 text-xl font-bold">Enterprise</h3>
              <p className="mb-6 text-xs text-neutral-400">For media enterprises.</p>
              <div className="my-4 h-px bg-neutral-900" />
              <ul className="space-y-3.5 text-xs text-neutral-300">
                <li className="flex items-start gap-2 font-bold text-neutral-100">
                  ✓ Dedicated Mobile App Store Submissions
                </li>
                <li className="flex items-start gap-2 font-semibold">
                  ✓ High performance 4K bitrate streaming
                </li>
                <li className="flex items-start gap-2">✓ Unlimited modular chat rooms</li>
                <li className="flex items-start gap-2">
                  ✓ Multi-feed streams (crowd/musician cams)
                </li>
                <li className="flex items-start gap-2">
                  ✓ X32 hardware audio mixer telemetry integration
                </li>
                <li className="flex items-start gap-2">✓ Full enterprise layout code overrides</li>
                <li className="flex items-start gap-2">
                  ✓ Premium white-glove onboarding framework
                </li>
                <li className="flex items-start gap-2">✓ 24/7 dedicated engineering SLA support</li>
              </ul>
            </div>
            <a
              href="/onboarding?tier=enterprise"
              className="mt-8 w-full rounded-md bg-neutral-800 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-neutral-700"
            >
              Request Access
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
