'use client';

import Image from 'next/image';
import PlanSelectionCta from '@/components/admin/PlanSelectionCta';

const MINISTRY_PLANS = [
  {
    id: 'starter' as const,
    name: 'SANCTUARY STARTER',
    price: '$149',
    tone: 'gold',
    cta: 'Provision Node',
    featured: false,
    features: [
      'Shared sanctuary subdomain',
      'Basic congregation analytics',
      '720p HD sermon distribution',
      'Email pastoral support',
      '1 active altar prayer room',
    ],
  },
  {
    id: 'pro' as const,
    name: 'MINISTRY NETWORK PRO',
    price: '$499',
    tone: 'purple',
    cta: 'Deploy Sanctuary',
    featured: true,
    features: [
      'Custom domain under your church name',
      'Embedded tithe & offering checkout',
      '1080p high-bitrate broadcast pipelines',
      'Advanced ministry analytics',
      'vMix & X32 hardware integrations',
      'Priority media-team support',
    ],
  },
  {
    id: 'enterprise' as const,
    name: 'DIOCESE ENTERPRISE',
    price: '$1,499',
    tone: 'gold',
    cta: 'Contact Diocese Sales',
    featured: false,
    features: [
      'Native mobile app (App Store & Google Play)',
      'Custom enterprise faith codebase',
      '4K extreme bitrate distribution',
      'Dedicated sanctuary infrastructure',
      'Uncapped intercessor chat grids',
      '24/7 priority bishop support',
    ],
  },
] as const;

export default function PlatformLandingPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#7A00FF] overflow-y-auto relative pb-16">

      {/* Studio Backlight Atmospheric Glow Matrix */}
      <div className="absolute top-[5%] right-[15%] w-[550px] h-[400px] bg-gradient-to-br from-[#FFB800]/10 via-[#7A00FF]/10 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Modern Wireframe Grid Layout Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0e1a_1px,transparent_1px),linear-gradient(to_bottom,#0c0e1a_1px,transparent_1px)] bg-[size:4rem_4rem] mask-image-[radial-gradient(ellipse_60%_50%_at_50%_30%,#000_85%,transparent_100%)] opacity-40 pointer-events-none z-0" />

      {/* Global Framework Header Shell */}
      <nav className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center relative z-20 border-b border-neutral-900/50 backdrop-blur-md bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800] shadow-[0_0_12px_#FFB800]" />
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-400">PΛRΛBLE FAITH ENGINE</span>
        </div>
        <a href="/onboarding" className="text-[11px] font-mono tracking-widest uppercase bg-neutral-950 border border-neutral-800 text-[#D9E2EC] px-5 py-2.5 rounded hover:border-[#FFB800] hover:text-white transition-all duration-300">
          Console Registry →
        </a>
      </nav>

      {/* SECTION 1: FAITH-TECH ASYMMETRICAL HERO GRID */}
      <header className="max-w-7xl mx-auto px-8 pt-16 lg:pt-24 pb-20 relative z-10 grid lg:grid-cols-12 gap-12 items-center min-h-[75vh]">

        {/* Left Side: Authoritative Ministry Value Copy */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[1.05] mb-6">
            The Digital Sanctuary <br />
            Infrastructure for <br />
            Global Ministries. <br />
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-light leading-relaxed max-w-xl mb-10">
            Deploy a completely independent, white-labeled streaming network under your church&apos;s name. Complete with frictionless in-stream tithe plates, real-time altar prayer panels, and 0% transaction taxes.
          </p>
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <a href="/onboarding" className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded bg-[#FFB800] hover:opacity-90 text-xs font-bold tracking-widest uppercase text-black transition-all duration-300 shadow-[0_0_30px_rgba(255,184,0,0.15)]">
              Provision Sanctuary Node →
            </a>
            <a href="#specification" className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded border border-neutral-800 bg-neutral-950/40 text-xs font-semibold tracking-widest uppercase text-neutral-400 transition-colors hover:bg-neutral-900 duration-300">
              System Specs ↓
            </a>
          </div>
        </div>

        {/* Right Side: Showcase Device Mockup Card */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative w-full">
          <div className="relative flex flex-col items-center w-full max-w-md bg-neutral-950/20 border border-neutral-900/60 rounded-3xl p-10 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#7A00FF]/30 to-transparent" />

            <div className="relative w-44 h-44 mb-6">
              <Image
                src="/tenant-default/dashboard/flagship-logo.png"
                alt="PΛRΛBLE Faith OS emblem"
                fill
                priority
                sizes="176px"
                className="object-contain"
              />
            </div>

            <div className="text-center select-none mb-6">
              <h2 className="text-3xl tracking-[0.4em] font-light text-white uppercase ml-[0.4em]">
                P<span className="inline-block scale-x-[1.15] font-extralight text-neutral-300">Λ</span>R<span className="inline-block scale-x-[1.15] font-extralight text-neutral-300">Λ</span>BLE
              </h2>
              <h3 className="text-[10px] tracking-[0.65em] text-[#FFB800] uppercase font-bold mt-1.5 ml-[0.65em]">
                FAITH OS
              </h3>
            </div>

            <div className="w-full bg-black/60 border border-neutral-900 rounded-xl py-3 px-4 flex flex-wrap justify-center items-center gap-x-3 text-[9px] font-mono tracking-wider uppercase text-neutral-400">
              <span>Own Your Sanctuary</span>
              <span className="text-neutral-800">|</span>
              <span>Own Your Stream</span>
              <span className="text-neutral-800">|</span>
              <span className="text-[#FFB800] font-medium">Own Your Ministry</span>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 1.5: THE GENEROSITY & AD AUTONOMY MANIFESTO */}
      <section className="max-w-7xl mx-auto px-8 py-20 relative z-10 border-t border-neutral-900 bg-black">
        <div className="max-w-3xl mb-16">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#FFB800] mb-3">Sovereign Generosity Engine</p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none mb-4">
            0% Offering Taxes. <br />
            <span className="text-transparent bg-gradient-to-r from-[#FFB800] to-[#7A00FF] bg-clip-text">100% Retained Generosity.</span>
          </h2>
          <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-2xl">
            Stop sacrificing a 30% digital platform tax to secular application marketplace containers. Parable Faith operates strictly on flat-rate infrastructure fees, routing tithes, offerings, and seed tokens directly to your ministry&apos;s secure bank account.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-stretch">
          <div className="p-8 rounded-2xl bg-neutral-950/60 border border-neutral-900 flex flex-col justify-between hover:border-[#FFB800]/20 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFB800]/5 border border-[#FFB800]/10 flex items-center justify-center text-sm">🏺</div>
              <h3 className="text-lg font-bold tracking-tight text-white">In-Stream Tithe Plate</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Congregants can submit one-time tithes or configure automated recurring building-fund options directly over the active video timeline. Giving sheets process natively inside the broadcast layout layer without ever interrupting the sermon or forcing users to open external web browser links.
              </p>
            </div>
            <div className="text-[10px] font-mono tracking-widest text-[#FFB800] uppercase mt-6">0% GIVING COMMISSION TAX</div>
          </div>

          <div className="p-8 rounded-2xl bg-neutral-950/60 border border-neutral-900 flex flex-col justify-between hover:border-[#7A00FF]/20 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#7A00FF]/5 border border-[#7A00FF]/10 flex items-center justify-center text-sm">🌾</div>
              <h3 className="text-lg font-bold tracking-tight text-white">Vital Seed Sowing Economics</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Incorporate a thriving virtual token economy based on biblical generosity concepts. Members can fund an internal Seed Wallet and execute one-tap seed sowing transactions during high-impact moments in the message, instantly triggering scrolling chat announcements to drive communal support.
              </p>
            </div>
            <div className="text-[10px] font-mono tracking-widest text-[#7A00FF] uppercase mt-6">100% INDEPENDENT BANK ROUTING</div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MINISTRY SPECIFICATION BLOCKS */}
      <section id="specification" className="max-w-7xl mx-auto px-8 py-20 relative z-10 border-t border-neutral-900 bg-black grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-900 flex flex-col gap-4 hover:border-[#FFB800]/20 transition-colors">
          <span className="font-mono text-xs font-bold text-[#FFB800]">01</span>
          <div>
            <h4 className="text-xs font-bold tracking-wide uppercase text-white mb-1.5">Sanctuary Control Plane</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-light">Media team dashboards equipped with preflight stream manifest reachability probes and dynamic phase routers shifting users from pre-service countdowns onto the live stage.</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-900 flex flex-col gap-4 hover:border-[#7A00FF]/20 transition-colors">
          <span className="font-mono text-xs font-bold text-[#7A00FF]">02</span>
          <div>
            <h4 className="text-xs font-bold tracking-wide uppercase text-white mb-1.5">Altar Prayer Telemetry</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-light">Interactive prayer-request sheets embedded in the video player. Viewers can submit intercession requests which pin instantly onto backstage intercessor dashboards.</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-900 flex flex-col gap-4 hover:border-[#FFB800]/20 transition-colors">
          <span className="font-mono text-xs font-bold text-[#FFB800]">03</span>
          <div>
            <h4 className="text-xs font-bold tracking-wide uppercase text-white mb-1.5">Sermon Archive Catalog</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-light">A luxury Netflix-style browse catalog displaying recorded message loops, complete with interactive scrolling chat replay covers that breathe life into past events.</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-900 flex flex-col gap-4 hover:border-[#7A00FF]/20 transition-colors">
          <span className="font-mono text-xs font-bold text-[#7A00FF]">04</span>
          <div>
            <h4 className="text-xs font-bold tracking-wide uppercase text-white mb-1.5">Hardware Sound Integrations</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-light">Websocket communication pipelines syncing remote dashboard operators to on-site hardware layers, tracking vMix DVR recorders and Behringer X32 mixer channels.</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: MINISTRY RESOURCE ALLOCATIONS (PRICING GRID) */}
      <section id="pricing" className="max-w-7xl mx-auto px-8 py-20 relative z-10 border-t border-neutral-900 bg-black">
        <div className="max-w-3xl mb-16">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#7A00FF] mb-3">Ministry Resource Allocations</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-none mb-4">
            Flat-Rate Sanctuary Nodes. <br />
            <span className="text-transparent bg-gradient-to-r from-[#FFB800] to-[#7A00FF] bg-clip-text">No Tithe Commission.</span>
          </h2>
          <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-2xl">
            Provision the right infrastructure tier for your congregation size — from single-campus sanctuaries to multi-site diocese networks. Every plan routes offerings directly to your ministry account with zero platform withholding.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {MINISTRY_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`relative p-8 rounded-2xl bg-neutral-950 border flex flex-col gap-6 transition-all duration-300 ${
                plan.featured
                  ? 'border-[#7A00FF]/40 shadow-[0_0_40px_rgba(122,0,255,0.12)]'
                  : 'border-neutral-900 hover:border-neutral-700'
              }`}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-6 text-[9px] font-mono tracking-widest uppercase bg-[#7A00FF] text-white px-3 py-1 rounded">
                  Most Deployed
                </span>
              ) : null}
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-300 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${plan.tone === 'purple' ? 'text-[#7A00FF]' : 'text-[#FFB800]'}`}>
                    {plan.price}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">/mo</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-[11px] text-neutral-400 font-light leading-relaxed flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 ${plan.tone === 'purple' ? 'text-[#7A00FF]' : 'text-[#FFB800]'}`}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <PlanSelectionCta
                tierId={plan.id}
                className={`w-full h-11 inline-flex items-center justify-center gap-2 rounded text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                  plan.featured
                    ? 'bg-[#FFB800] text-black hover:opacity-90'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-[#FFB800]/40 hover:text-white'
                }`}
              >
                {plan.cta}
              </PlanSelectionCta>
            </article>
          ))}
        </div>
      </section>

      {/* Global Framework Status Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-8 relative z-10 border-t border-neutral-900">
        <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-neutral-600 text-center">
          PΛRΛBLE FAITH INFRASTRUCTURE SYSTEM NODES ENGINE RUNNING STABLE // SOVEREIGN ACCOUNT PROTECTION ACTIVE
        </p>
      </footer>
    </div>
  );
}
