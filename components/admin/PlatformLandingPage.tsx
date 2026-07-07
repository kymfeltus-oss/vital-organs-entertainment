"use client";

import Image from "next/image";

export default function PlatformLandingPage() {
  return (
    <div className="relative min-h-screen overflow-y-auto bg-[#000000] font-sans text-white selection:bg-[#6C4DFF] selection:text-white">
      <div className="pointer-events-none absolute left-1/2 top-[10%] z-0 h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#00C2FF]/15 via-[#6C4DFF]/10 to-[#FF0F8E]/5 blur-[130px]" />
      <div className="pointer-events-none absolute left-[10%] top-[1200px] z-0 h-[500px] w-[500px] rounded-full bg-[#6C4DFF]/5 blur-[140px]" />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#0c0e1a_1px,transparent_1px),linear-gradient(to_bottom,#0c0e1a_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_90%,transparent_100%)]" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between border-b border-neutral-900/60 bg-black/20 px-8 py-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00C2FF] shadow-[0_0_12px_#00C2FF]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            PΛRΛBLE CORE INFRASTRUCTURE
          </span>
        </div>
        <a
          href="/onboarding"
          className="rounded border border-neutral-800 bg-gradient-to-b from-neutral-900 to-black px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-[#D9E2EC] shadow-md transition-all duration-300 hover:border-[#00C2FF] hover:text-white"
        >
          Console Registry
        </a>
      </nav>

      <header className="relative z-10 mx-auto flex min-h-[85vh] max-w-5xl flex-col items-center justify-center px-6 pb-20 pt-12 text-center">
        <div className="group relative flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-3xl border border-neutral-900/80 bg-neutral-950/40 p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6C4DFF]/40 to-transparent" />

          <div className="relative mb-8 h-40 w-40 transition-transform duration-700 hover:scale-105">
            <Image
              src="/tenant-default/dashboard/flagship-logo.png"
              alt="PΛRΛBLE 3D Infrastructure Logo"
              fill
              className="object-contain drop-shadow-[0_0_35px_rgba(108,77,255,0.15)]"
              priority
            />
          </div>

          <div className="mb-6 select-none text-center">
            <h1 className="ml-[0.4em] text-3xl font-light uppercase tracking-[0.4em] text-white md:text-4xl">
              P<span className="inline-block scale-x-[1.15] font-extralight text-neutral-300">Λ</span>R
              <span className="inline-block scale-x-[1.15] font-extralight text-neutral-300">Λ</span>BLE
            </h1>
            <h2 className="ml-[0.65em] mt-2 bg-gradient-to-r from-[#00C2FF] via-[#6C4DFF] to-[#FF0F8E] bg-clip-text text-[11px] font-bold uppercase tracking-[0.65em] text-transparent">
              STREAMING
            </h2>
          </div>

          <h3 className="mb-8 max-w-md text-xl font-bold leading-tight tracking-tight text-neutral-300 md:text-2xl">
            The Enterprise Operating System for Broadcast Networks.
          </h3>

          <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl border border-neutral-900 bg-black/60 px-6 py-3.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
            <span className="text-white">Own Your Stream</span>
            <span className="text-neutral-800">|</span>
            <span className="text-white">Own Your Brand</span>
            <span className="text-neutral-800">|</span>
            <span className="text-white">Own Your Revenue</span>
            <span className="text-neutral-800">|</span>
            <span className="font-semibold text-[#00C2FF]">Go Global</span>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
          <a
            href="/onboarding"
            className="inline-flex h-12 w-full items-center justify-center rounded bg-white px-8 text-xs font-bold uppercase tracking-widest text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all duration-300 hover:bg-neutral-200 sm:w-auto"
          >
            Deploy Architecture
          </a>
          <a
            href="#specification"
            className="inline-flex h-12 w-full items-center justify-center rounded border border-neutral-800 bg-neutral-950/60 px-8 text-xs font-semibold uppercase tracking-widest text-neutral-400 transition-colors duration-300 hover:bg-neutral-900 sm:w-auto"
          >
            System Specs
          </a>
        </div>
      </header>

      <section
        id="specification"
        className="relative z-10 mx-auto max-w-6xl border-t border-neutral-900 bg-black px-8 py-24"
      >
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em] text-[#6C4DFF]">
            System Blueprint
          </p>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">
            Architectural Specifications
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            Parable Streaming abstracts away the complexity of CDN provisioning, payment logic, and
            hardware edge synchronization, deploying a containerised multi-tenant broadcast
            architecture in milliseconds.
          </p>
        </div>

        <div className="grid gap-12 text-sm md:grid-cols-2">
          <div className="space-y-4 border-l-2 border-neutral-900 pl-6 transition-colors duration-300 hover:border-[#00C2FF]">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#00C2FF]">
              01 / Broadcast Control & CDN Probes
            </h4>
            <p className="text-xs leading-relaxed text-neutral-400">
              Every provisioned brand deployment receives an isolated{" "}
              <strong className="text-white">Owner Production Cockpit</strong> providing full
              telemetry control over active shows. Before pushing streams live, automated preflight
              HLS manifest accessibility probes query upstream configurations to prevent dead
              streams. Video delivery natively supports external RTMP inputs (vMix, OBS), automated
              browser WebRTC streams, and restream-first multi-lane delivery.
            </p>
          </div>

          <div className="space-y-4 border-l-2 border-neutral-900 pl-6 transition-colors duration-300 hover:border-[#6C4DFF]">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#6C4DFF]">
              02 / Telemetry & Hardware Mixers
            </h4>
            <p className="text-xs leading-relaxed text-neutral-400">
              Built with hardware integrations directly inside the administrative system logic.
              Network operators can query remote <strong className="text-white">vMix API nodes</strong>{" "}
              to execute scenes, trigger cuts, and initialize edge DVR recordings. Advanced
              configurations support real-time audio channel telemetry and preset recalls targeting
              connected <strong className="text-white">Behringer X32 audio mixing consoles</strong>{" "}
              over secure websocket paths.
            </p>
          </div>

          <div className="space-y-4 border-l-2 border-neutral-900 pl-6 transition-colors duration-300 hover:border-[#FF0F8E]">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#FF0F8E]">
              03 / In-Stream Virtual Token Economics
            </h4>
            <p className="text-xs leading-relaxed text-neutral-400">
              Monetization maps seamlessly across multiple streams without forcing viewers out of the
              active player canvas. The built-in{" "}
              <strong className="text-white">Platform Token Store</strong> runs automated wallet
              allocation monitoring. Viewers can purchase digital token bundles via Stripe and
              execute real-time virtual gifting during live streams, processing instantly through
              signature-verified PostgreSQL RPC handlers.
            </p>
          </div>

          <div className="space-y-4 border-l-2 border-neutral-900 pl-6 transition-colors duration-300 hover:border-neutral-700">
            <h4 className="font-mono text-xs uppercase tracking-wider text-neutral-400">
              04 / Dynamic Layout Phase Routers
            </h4>
            <p className="text-xs leading-relaxed text-neutral-400">
              The attendee viewer interface operates through an automated state loop: pre-event holding
              rooms (up to a 2-hour buffer window complete with slot-based animated countdown digits)
              seamlessly morph into the live stage matrix upon broadcast initiation, culminating in
              post-event engagement hubs with persistent text logs and support donation prompts.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl border-t border-neutral-900 bg-black px-8 py-20">
        <p className="mb-16 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500">
          Global Resource Allocations
        </p>

        <div className="grid items-stretch gap-8 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-neutral-900 bg-neutral-950 p-8">
            <div>
              <div className="mb-1 font-mono text-xs text-neutral-500">01 / NODE TIER</div>
              <h3 className="mb-6 text-lg font-bold tracking-wide">Starter Node</h3>
              <ul className="space-y-4 text-xs font-light text-[#D9E2EC]">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#00C2FF]">→</span>
                  <span>Shared platform subdomain mapping</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#00C2FF]">→</span>
                  <span>720p HD live video distribution</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#00C2FF]">→</span>
                  <span>Live community chat (1 channel instance)</span>
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
                  <span>Custom domain integration (brand.com)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#6C4DFF]">→</span>
                  <span>1080p high-bitrate distribution nodes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#6C4DFF]">→</span>
                  <span>5 concurrent automated community chat nodes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#6C4DFF]">→</span>
                  <span>vMix API hardware triggers & broadcast overlays</span>
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
                  <span>Dedicated mobile App Store delivery (Capacitor)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#FF0F8E]">→</span>
                  <span>4K extreme bitrate network nodes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#FF0F8E]">→</span>
                  <span>X32 hardware audio mixer telemetry mapping</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-[#FF0F8E]">→</span>
                  <span>Full enterprise template codebase overrides</span>
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

      <footer className="relative z-10 border-t border-neutral-900 bg-black py-10 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-neutral-600">
        PΛRΛBLE MEDIA SYSTEM INFRASTRUCTURE LABS // ALL OPERATIONS STABLE
      </footer>
    </div>
  );
}
