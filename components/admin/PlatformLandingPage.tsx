"use client";

import ParableLogo from "@/components/ui/brand/ParableLogo";

export default function PlatformLandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#000000] font-sans text-white selection:bg-[#6C4DFF] selection:text-white">
      <div className="pointer-events-none absolute left-1/2 top-[-20%] z-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#00C2FF]/10 via-[#6C4DFF]/5 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] z-0 h-[500px] w-[500px] rounded-full bg-[#FF0F8E]/5 blur-[160px]" />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#111322_1px,transparent_1px),linear-gradient(to_bottom,#111322_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-8 py-8">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#00C2FF] shadow-[0_0_10px_#00C2FF]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            PΛRΛBLE CORE OS
          </span>
        </div>
        <a
          href="/onboarding"
          className="rounded border border-neutral-800/80 bg-neutral-950 px-5 py-2.5 text-xs font-semibold tracking-wider text-[#D9E2EC] transition-all duration-300 hover:border-[#6C4DFF] hover:text-white"
        >
          Console Registry
        </a>
      </nav>

      <header className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-8 pb-24 pt-20 text-center">
        <div className="mb-14">
          <ParableLogo size={100} />
        </div>

        <h2 className="mb-8 max-w-4xl bg-gradient-to-b from-white via-[#D9E2EC] to-neutral-600 bg-clip-text text-4xl font-extrabold leading-[1.05] tracking-tighter text-transparent md:text-7xl">
          The Operating System for <br />
          Global Media Infrastructure
        </h2>

        <div className="mb-12 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">
          <span>Own Your Stream.</span>
          <span className="text-neutral-700">•</span>
          <span>Own Your Brand.</span>
          <span className="text-neutral-700">•</span>
          <span>Own Your Revenue.</span>
          <span className="text-neutral-700">•</span>
          <span>Go Global.</span>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-5 sm:w-auto sm:flex-row">
          <a
            href="/onboarding"
            className="inline-flex h-12 w-full items-center justify-center rounded bg-white px-8 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_30px_rgba(255,255,255,0.08)] transition-all duration-300 hover:bg-[#D9E2EC] sm:w-auto"
          >
            Deploy Architecture
          </a>
          <a
            href="#matrix"
            className="inline-flex h-12 w-full items-center justify-center rounded border border-neutral-800 bg-[#050816]/40 px-8 text-xs font-semibold uppercase tracking-widest text-neutral-400 transition-colors duration-300 hover:bg-neutral-900 sm:w-auto"
          >
            Read Protocol Matrix
          </a>
        </div>
      </header>

      <section id="matrix" className="relative z-10 mx-auto max-w-6xl border-t border-neutral-900 px-8 py-20">
        <p className="mb-16 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500">
          Engineered Platform Foundations
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="group rounded-xl border border-neutral-900/80 bg-neutral-950 p-8 transition-all duration-500 hover:border-[#00C2FF]/30 hover:bg-[#050816]/20">
            <div className="mb-4 flex items-center gap-3 text-sm font-bold tracking-wide text-white">
              <span className="font-mono text-[#00C2FF] group-hover:animate-pulse">01 //</span> Production
              Control Plane
            </div>
            <p className="text-xs font-light leading-relaxed text-[#D9E2EC]">
              Centralized go-live cockpits, automated preflight HLS manifest reachability probes, and
              custom studio routing modules mapping pre-show streams safely to live production views.
            </p>
          </div>

          <div className="group rounded-xl border border-neutral-900/80 bg-neutral-950 p-8 transition-all duration-500 hover:border-[#6C4DFF]/30 hover:bg-[#050816]/20">
            <div className="mb-4 flex items-center gap-3 text-sm font-bold tracking-wide text-white">
              <span className="font-mono text-[#6C4DFF] group-hover:animate-pulse">02 //</span> Live
              Community Engines
            </div>
            <p className="text-xs font-light leading-relaxed text-[#D9E2EC]">
              High-throughput real-time communication feeds, rate-limited animated graphic audience
              applause tracking, and direct backstage Q&A request dashboards with interactive screen
              layouts.
            </p>
          </div>

          <div className="group rounded-xl border border-neutral-900/80 bg-neutral-950 p-8 transition-all duration-500 hover:border-[#FF0F8E]/30 hover:bg-[#050816]/20">
            <div className="mb-4 flex items-center gap-3 text-sm font-bold tracking-wide text-white">
              <span className="font-mono text-[#FF0F8E] group-hover:animate-pulse">03 //</span>{" "}
              Financial & Token Systems
            </div>
            <p className="text-xs font-light leading-relaxed text-[#D9E2EC]">
              Integrated cryptographic platform token shops, one-tap virtual gifting modules, and
              secure signature-verified Postgres RPC data sync automation for premium access passes.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto mb-20 max-w-6xl border-t border-neutral-900 px-8 py-20">
        <p className="mb-16 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500">
          Global Infrastructure Allocations
        </p>

        <div className="grid items-stretch gap-8 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-neutral-900 bg-neutral-950 p-8">
            <div>
              <div className="mb-1 font-mono text-xs text-neutral-500">01 / NODE TIER</div>
              <h3 className="mb-6 text-lg font-bold tracking-wide">Starter Node</h3>
              <ul className="space-y-4 text-xs font-light text-[#D9E2EC]">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#00C2FF]">→</span>
                  <span>Shared platform routing domain assignment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#00C2FF]">→</span>
                  <span>720p HD live broadcast player limits</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#00C2FF]">→</span>
                  <span>Standard live communication feed (1 room)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#00C2FF]">→</span>
                  <span>Cinematic onboarding & identity gate panels</span>
                </li>
              </ul>
            </div>
            <a
              href="/onboarding?tier=starter"
              className="mt-12 block w-full rounded border border-neutral-800 bg-neutral-900 py-3 text-center font-mono text-xs uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white"
            >
              Request Platform Trial
            </a>
          </div>

          <div className="relative flex flex-col justify-between rounded-xl border border-[#6C4DFF] bg-[#050816]/30 p-8 shadow-[0_0_50px_rgba(108,77,255,0.08)]">
            <span className="absolute -top-3 right-6 rounded bg-gradient-to-r from-[#00C2FF] via-[#6C4DFF] to-[#FF0F8E] px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
              Standard Spec
            </span>
            <div>
              <div className="mb-1 font-mono text-xs text-[#6C4DFF]">02 / PRO ENGINE</div>
              <h3 className="mb-6 text-lg font-bold tracking-wide">Network Pro</h3>
              <ul className="space-y-4 text-xs font-light text-[#D9E2EC]">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#6C4DFF]">→</span>
                  <span>Custom domain integration (yourbrand.com)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#6C4DFF]">→</span>
                  <span>1080p high-bitrate distribution streams</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#6C4DFF]">→</span>
                  <span>5 concurrent automated community chat nodes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#6C4DFF]">→</span>
                  <span>vMix API hardware hooks & overlay engines</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#6C4DFF]">→</span>
                  <span>Stripe configuration for token shops & card billing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#6C4DFF]">→</span>
                  <span>Real-time studio sandbox previews</span>
                </li>
              </ul>
            </div>
            <a
              href="/onboarding?tier=pro"
              className="mt-12 block w-full rounded bg-[#6C4DFF] py-3 text-center font-mono text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(108,77,255,0.25)] transition-opacity hover:opacity-90"
            >
              Provision Engine
            </a>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-neutral-900 bg-neutral-950 p-8">
            <div>
              <div className="mb-1 font-mono text-xs text-neutral-500">03 / FABRIC CLUSTER</div>
              <h3 className="mb-6 text-lg font-bold tracking-wide">Enterprise Stack</h3>
              <ul className="space-y-4 text-xs font-light text-[#D9E2EC]">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#FF0F8E]">→</span>
                  <span>Dedicated mobile App Store submissions (Capacitor)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#FF0F8E]">→</span>
                  <span>Ultra performance 4K extreme bitrate tier</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#FF0F8E]">→</span>
                  <span>Unlimited concurrent live communication feeds</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#FF0F8E]">→</span>
                  <span>X32 hardware audio mixer telemetry mapping</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#FF0F8E]">→</span>
                  <span>Full enterprise template infrastructure source overrides</span>
                </li>
              </ul>
            </div>
            <a
              href="/onboarding?tier=enterprise"
              className="mt-12 block w-full rounded border border-neutral-800 bg-neutral-900 py-3 text-center font-mono text-xs uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white"
            >
              Access Architecture
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-neutral-900 py-10 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-neutral-600">
        PΛRΛBLE MEDIA SYSTEM INFRASTRUCTURE LABS // ALL OPERATIONS STABLE
      </footer>
    </div>
  );
}
