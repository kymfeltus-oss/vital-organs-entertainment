import Link from "next/link";
import SystemSpecsTable from "@/components/admin/SystemSpecsTable";
import {
  Building2,
  ChevronDown,
  Globe2,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const FEATURE_STRIP = [
  {
    icon: Globe2,
    label: "SOVEREIGN INFRASTRUCTURE",
    description: "Independent broadcast nodes under your ministry domain.",
  },
  {
    icon: Wallet,
    label: "ZERO PLATFORM TAXES",
    description: "Flat infrastructure fees. No offering commission.",
  },
  {
    icon: ShieldCheck,
    label: "MAXIMUM SECURITY & CONTROL",
    description: "End-to-end ownership of message, data, and revenue.",
  },
  {
    icon: Building2,
    label: "BUILT FOR MINISTRIES AT SCALE",
    description: "Enterprise-grade systems for global congregation reach.",
  },
] as const;

const TRUSTED_MARKS = ["MSM", "GCC", "LWC", "HBC", "RSM", "NCM"] as const;

function ParableWordmark({ size = "nav" }: { size?: "nav" | "phone" }) {
  if (size === "phone") {
    return (
      <p className="text-[11px] font-semibold tracking-[0.42em] text-white uppercase">
        P<span className="font-light text-white/80">Λ</span>R
        <span className="font-light text-white/80">Λ</span>BLE
      </p>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm font-semibold tracking-[0.38em] text-white uppercase">
        P<span className="font-light text-white/85">Λ</span>R
        <span className="font-light text-white/85">Λ</span>BLE
      </span>
      <span className="text-[10px] font-bold tracking-[0.55em] text-[#FFB800] uppercase">
        F<span className="font-light">Λ</span>ITH OS
      </span>
    </div>
  );
}

function SanctuaryArchIcon() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="relative z-10 h-[58%] w-[58%] text-white/90"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 92 V52 A42 42 0 0 1 102 52 V92"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M60 34 V92" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function TabletMockup() {
  return (
    <div
      className="faith-device-float relative w-[min(100%,440px)] rounded-[1.45rem] border border-white/14 bg-[rgba(255,255,255,0.05)] p-3.5 shadow-[0_50px_140px_rgba(0,0,0,0.85),0_0_80px_rgba(255,184,0,0.08)] backdrop-blur-2xl"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute -inset-px rounded-[1.45rem] bg-[linear-gradient(135deg,rgba(255,184,0,0.22),transparent_38%,transparent_62%,rgba(255,255,255,0.08))] opacity-70" />

      <div className="relative mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className="faith-live-pulse rounded-full border border-[#FFB800]/35 bg-[#FFB800] px-2.5 py-0.5 text-[9px] font-bold tracking-[0.22em] text-black uppercase shadow-[0_0_18px_rgba(255,184,0,0.45)]">
            Live
          </span>
          <span className="text-[9px] tracking-[0.2em] text-white/50 uppercase">
            12,482 Viewers
          </span>
        </div>
        <span className="faith-signal-dot h-2 w-2 rounded-full bg-[#FFB800] shadow-[0_0_14px_#FFB800]" />
      </div>

      <div className="relative mb-3 overflow-hidden rounded-xl border border-white/12 bg-black">
        <div className="faith-stage-glow absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,184,0,0.34),transparent_58%)]" />
        <div className="faith-light-sweep absolute inset-0 opacity-40" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(255,184,0,0.14))]" />
        <div className="relative flex aspect-[16/10] items-center justify-center">
          <div className="absolute h-[72%] w-[72%] rounded-full bg-[radial-gradient(circle,rgba(255,184,0,0.16)_0%,transparent_68%)]" />
          <SanctuaryArchIcon />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-white/12 bg-[rgba(255,255,255,0.03)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="mb-1.5 text-[8px] tracking-[0.24em] text-white/45 uppercase">Tithe Plate</p>
          <p className="text-xl font-semibold tracking-tight text-white">$250.00</p>
          <div className="mt-2.5 flex gap-1.5">
            {["$50", "$100", "$250"].map((amount) => (
              <span
                key={amount}
                className={`rounded px-2 py-0.5 text-[8px] tracking-wide transition-colors ${
                  amount === "$250"
                    ? "border border-[#FFB800]/55 bg-[#FFB800]/14 text-[#FFB800] shadow-[0_0_12px_rgba(255,184,0,0.18)]"
                    : "border border-white/10 text-white/55"
                }`}
              >
                {amount}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[8px] font-bold tracking-[0.2em] text-[#FFB800] uppercase">
            Give Now →
          </p>
          <p className="mt-1 text-[7px] tracking-[0.16em] text-white/38 uppercase">0% Transaction Fee</p>
        </div>

        <div className="rounded-lg border border-white/12 bg-[rgba(255,255,255,0.03)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="mb-1.5 text-[8px] tracking-[0.24em] text-white/45 uppercase">Prayer Request</p>
          <div className="space-y-2">
            <div className="h-7 rounded border border-white/10 bg-black/70 shadow-[inset_0_1px_8px_rgba(0,0,0,0.55)]" />
            <div className="h-7 rounded border border-white/10 bg-black/70 shadow-[inset_0_1px_8px_rgba(0,0,0,0.55)]" />
          </div>
          <p className="mt-3 text-[8px] tracking-[0.18em] text-white/52 uppercase">Submit Intercession</p>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div
      className="faith-device-float-delayed relative w-[178px] rounded-[2.1rem] border border-white/14 bg-[rgba(255,255,255,0.05)] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.82),0_0_50px_rgba(255,184,0,0.1)] backdrop-blur-2xl"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute -inset-px rounded-[2.1rem] bg-[linear-gradient(160deg,rgba(255,184,0,0.18),transparent_45%)] opacity-80" />
      <div className="mx-auto mb-3 h-1 w-11 rounded-full bg-white/18" />
      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/12 bg-black px-4 py-7 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(255,184,0,0.12),transparent_55%)]" />
        <ParableWordmark size="phone" />
        <p className="relative mt-6 text-[9px] font-semibold tracking-[0.36em] text-white/72 uppercase">
          Welcome Home
        </p>
        <div className="relative mt-5 space-y-1.5">
          <p className="text-[10px] tracking-[0.3em] text-white/88 uppercase">True Worship</p>
          <p className="text-[10px] tracking-[0.3em] text-white/88 uppercase">True Community</p>
        </div>
        <div className="faith-cta-glow relative mt-6 rounded border border-[#FFB800]/45 bg-[#FFB800]/10 px-2.5 py-2.5 text-[8px] font-bold tracking-[0.22em] text-[#FFB800] uppercase">
          Enter Sanctuary →
        </div>
      </div>
    </div>
  );
}

function DeviceHeroComposition() {
  return (
    <div className="relative mx-auto flex min-h-[380px] w-full max-w-[580px] items-center justify-center sm:min-h-[460px] [perspective:1400px]">
      <div className="faith-aurora pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,184,0,0.16)_0%,transparent_68%)] blur-2xl sm:h-[340px] sm:w-[340px]" />
      <div className="faith-aurora-delayed pointer-events-none absolute right-[8%] top-[18%] h-[180px] w-[180px] rounded-full bg-[radial-gradient(circle,rgba(255,184,0,0.1)_0%,transparent_70%)] blur-3xl sm:h-[220px] sm:w-[220px]" />

      <div className="absolute left-[6%] top-[12%] z-0 h-20 w-20 rounded-full border border-[#FFB800]/10 bg-[#FFB800]/5 blur-sm sm:h-28 sm:w-28" />
      <div className="absolute bottom-[10%] right-[4%] z-0 h-16 w-16 rounded-full border border-white/8 bg-white/[0.02] sm:h-20 sm:w-20" />

      <div className="relative z-10 w-full scale-[0.88] sm:scale-100 [transform-style:preserve-3d]">
        <div className="absolute -right-3 top-4 z-30 sm:-right-1 sm:top-8 md:right-2 md:top-8 [transform:rotateY(18deg)_rotateX(6deg)_rotateZ(14deg)_translateZ(40px)]">
          <PhoneMockup />
        </div>
        <div className="relative z-20 mx-auto w-fit [transform:rotateY(-14deg)_rotateX(8deg)_rotateZ(-6deg)_translateZ(20px)]">
          <TabletMockup />
        </div>
      </div>
    </div>
  );
}

export default function PlatformLandingPage() {
  return (
    <div className="faith-landing min-h-screen overflow-x-hidden bg-[#000000] text-white antialiased">
      <style>{`
        @keyframes faith-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes faith-aurora-pulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.06); }
        }
        @keyframes faith-live-pulse {
          0%, 100% { box-shadow: 0 0 12px rgba(255,184,0,0.35); }
          50% { box-shadow: 0 0 22px rgba(255,184,0,0.65); }
        }
        @keyframes faith-signal-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.88); }
        }
        @keyframes faith-light-sweep {
          0% { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
          35% { opacity: 0.35; }
          100% { transform: translateX(140%) skewX(-12deg); opacity: 0; }
        }
        @keyframes faith-stage-glow {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.95; }
        }
        @keyframes faith-cta-glow {
          0%, 100% { box-shadow: inset 0 0 0 rgba(255,184,0,0); }
          50% { box-shadow: inset 0 0 18px rgba(255,184,0,0.12); }
        }
        @keyframes faith-hero-reveal {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .faith-device-float { animation: faith-float 7s ease-in-out infinite; }
        .faith-device-float-delayed { animation: faith-float 7s ease-in-out infinite 1.2s; }
        .faith-aurora { animation: faith-aurora-pulse 8s ease-in-out infinite; }
        .faith-aurora-delayed { animation: faith-aurora-pulse 10s ease-in-out infinite 2s; }
        .faith-live-pulse { animation: faith-live-pulse 2.4s ease-in-out infinite; }
        .faith-signal-dot { animation: faith-signal-dot 1.8s ease-in-out infinite; }
        .faith-light-sweep {
          background: linear-gradient(105deg, transparent 0%, rgba(255,184,0,0.18) 48%, transparent 100%);
          animation: faith-light-sweep 6.5s ease-in-out infinite;
        }
        .faith-stage-glow {
          background: radial-gradient(circle at 50% 45%, rgba(255,184,0,0.28) 0%, transparent 62%);
          animation: faith-stage-glow 4.5s ease-in-out infinite;
        }
        .faith-cta-glow { animation: faith-cta-glow 3.2s ease-in-out infinite; }
        .faith-hero-copy > * { animation: faith-hero-reveal 0.9s ease-out both; }
        .faith-hero-copy > *:nth-child(2) { animation-delay: 0.08s; }
        .faith-hero-copy > *:nth-child(3) { animation-delay: 0.16s; }
        .faith-hero-copy > *:nth-child(4) { animation-delay: 0.24s; }
        .faith-hero-copy > *:nth-child(5) { animation-delay: 0.32s; }
        .faith-hero-copy > *:nth-child(6) { animation-delay: 0.4s; }
        @media (prefers-reduced-motion: reduce) {
          .faith-device-float, .faith-device-float-delayed, .faith-aurora, .faith-aurora-delayed,
          .faith-live-pulse, .faith-signal-dot, .faith-light-sweep, .faith-stage-glow,
          .faith-cta-glow, .faith-hero-copy > * { animation: none !important; }
        }
      `}</style>

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_72%_0%,rgba(255,184,0,0.11),transparent_62%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_35%,#000_72%,transparent_100%)] opacity-25"
        aria-hidden="true"
      />

      <header className="relative z-20 border-b border-white/10">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10"
          aria-label="Primary"
        >
          <ParableWordmark />
          <Link
            href="/onboarding"
            className="inline-flex items-center rounded border border-[#FFB800]/55 bg-transparent px-4 py-2 text-[10px] font-semibold tracking-[0.28em] text-[#FFB800] uppercase transition-all duration-300 hover:border-[#FFB800] hover:bg-[#FFB800]/8 hover:text-white"
          >
            Console Registry →
          </Link>
        </nav>
      </header>

      <main id="main-content">
        <section className="relative z-10 mx-auto max-w-7xl px-6 pt-14 pb-10 md:px-10 md:pt-20 md:pb-16">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="faith-hero-copy lg:col-span-6">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/8 px-3 py-1.5 shadow-[0_0_24px_rgba(255,184,0,0.12)]">
                <span className="faith-signal-dot h-1.5 w-1.5 rounded-full bg-[#FFB800] shadow-[0_0_10px_#FFB800]" />
                <span className="text-[9px] font-medium tracking-[0.32em] text-[#FFB800] uppercase">
                  Faith Infrastructure System Core
                </span>
              </div>

              <h1 className="max-w-2xl text-4xl font-extrabold leading-[0.98] tracking-tight uppercase md:text-5xl lg:text-[3.35rem]">
                The Digital Sanctuary Infrastructure for{" "}
                <span className="text-[#FFB800]">Global Ministries.</span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-relaxed text-[rgba(255,255,255,0.68)] md:text-[15px]">
                Deploy a completely independent, white-labeled streaming network under your
                church&apos;s name. Complete with frictionless in-stream tithe plates, real-time altar
                prayer panels, and 0% transaction taxes.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/onboarding"
                  className="inline-flex h-11 items-center justify-center rounded bg-[#FFB800] px-6 text-[10px] font-bold tracking-[0.24em] text-black uppercase transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_28px_rgba(255,184,0,0.22)]"
                >
                  Provision Sanctuary Node →
                </Link>
                <a
                  href="#specification"
                  className="inline-flex h-11 items-center justify-center gap-1 rounded border border-white/14 bg-[rgba(255,255,255,0.04)] px-6 text-[10px] font-semibold tracking-[0.22em] text-[rgba(255,255,255,0.68)] uppercase transition-all duration-300 hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
                >
                  System Specs
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              <p className="mt-8 text-[9px] font-mono tracking-[0.28em] text-[rgba(255,255,255,0.68)] uppercase">
                Own Your Sanctuary <span className="text-white/20">|</span> Own Your Stream{" "}
                <span className="text-white/20">|</span>{" "}
                <span className="text-[#FFB800]">Own Your Ministry</span>
              </p>
            </div>

            <div className="relative lg:col-span-6">
              <DeviceHeroComposition />
            </div>
          </div>
        </section>

        <section
          id="features"
          className="relative z-10 border-y border-white/10 bg-[rgba(255,255,255,0.02)]"
          aria-label="Platform capabilities"
        >
          <div className="mx-auto grid max-w-7xl gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {FEATURE_STRIP.map(({ icon: Icon, label, description }) => (
              <article
                key={label}
                className="group relative overflow-hidden bg-[rgba(255,255,255,0.04)] px-6 py-7 backdrop-blur-md transition-all duration-500 hover:bg-[rgba(255,255,255,0.07)] hover:shadow-[inset_0_1px_0_rgba(255,184,0,0.25)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,184,0,0.45),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <Icon
                  className="mb-4 h-5 w-5 stroke-[1.5] text-white/55 transition-colors duration-300 group-hover:text-[#FFB800]"
                  aria-hidden="true"
                />
                <h2 className="text-[10px] font-bold tracking-[0.26em] text-white uppercase">{label}</h2>
                <p className="mt-2 text-xs leading-relaxed text-[rgba(255,255,255,0.68)]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <SystemSpecsTable />

        <section className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:px-10" aria-label="Trusted ministries">
          <p className="text-center text-[9px] font-semibold tracking-[0.34em] text-[rgba(255,255,255,0.68)] uppercase">
            Trusted by Ministries Worldwide
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {TRUSTED_MARKS.map((mark) => (
              <div
                key={mark}
                className="flex h-10 min-w-[72px] items-center justify-center rounded border border-white/10 bg-white/[0.03] px-4 text-[10px] font-semibold tracking-[0.22em] text-white/30 uppercase"
                aria-hidden="true"
              >
                {mark}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-[8px] font-mono tracking-[0.28em] text-[rgba(255,255,255,0.68)] uppercase md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800] shadow-[0_0_10px_#FFB800]" aria-hidden="true" />
            <p>
              PΛRΛBLE FAITH INFRASTRUCTURE SYSTEM NODES ENGINE RUNNING STABLE // SOVEREIGN ACCOUNT
              PROTECTION ACTIVE
            </p>
          </div>
          <p className="text-white/45">SECURE. SOVEREIGN. SANCTIFIED.</p>
        </div>
      </footer>
    </div>
  );
}
