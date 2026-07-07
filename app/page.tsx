import { headers } from "next/headers";
import { getTenantTheme } from "@/lib/theme/tenant-resolver";
import IntroMediaSplash from "@/components/features/intro/IntroMediaSplash";

export default async function RootPage() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id") || "default";

  if (tenantId !== "default" && tenantId !== "") {
    const theme = await getTenantTheme(tenantId);
    return (
      <main className="min-h-screen w-full bg-black">
        <IntroMediaSplash tenantTheme={theme} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white selection:bg-[#00f2ff] selection:text-black">
      <header className="mx-auto max-w-7xl px-6 py-16 text-center">
        <div className="mb-6 inline-block rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#00f2ff]">
          Now Available Globally
        </div>
        <h1 className="mb-6 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
          Launch Your Own Branded <br />
          Streaming Network
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-neutral-400 md:text-xl">
          Get a fully customized web platform and native mobile apps designed for your creators,
          church, or entertainment ecosystem.
        </p>
        <a
          href="/onboarding"
          className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black shadow transition-colors hover:bg-neutral-200"
        >
          Build Your Network
        </a>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-12 text-center text-3xl font-bold">Choose Your Scale</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-neutral-900 bg-neutral-900/50 p-8">
            <div>
              <h3 className="mb-2 text-xl font-bold">Starter Plan</h3>
              <p className="mb-6 text-xs text-neutral-400">Perfect for solo creators</p>
              <ul className="mb-8 space-y-3 text-sm text-neutral-300">
                <li>• Shared marketplace web domain</li>
                <li>• Full 720p HD live streaming</li>
                <li>• Live audience chat module</li>
              </ul>
            </div>
            <a
              href="/onboarding?tier=starter"
              className="w-full rounded-md bg-neutral-800 py-2.5 text-center text-sm font-medium transition-colors hover:bg-neutral-700"
            >
              Get Started
            </a>
          </div>

          <div className="relative flex flex-col justify-between rounded-xl border-2 border-[#00f2ff] bg-neutral-900 p-8 shadow-[0_0_30px_rgba(0,242,255,0.1)]">
            <span className="absolute -top-3 right-6 rounded-full bg-[#00f2ff] px-3 py-0.5 text-xs font-bold uppercase text-black">
              Popular
            </span>
            <div>
              <h3 className="mb-2 text-xl font-bold">Network Pro</h3>
              <p className="mb-6 text-xs text-[#00f2ff]">For growing media brands</p>
              <ul className="mb-8 space-y-3 text-sm text-neutral-300">
                <li>• Custom web domain (yourbrand.com)</li>
                <li>• Crystal clear 1080p live streams</li>
                <li>• Custom fonts, color pickers, and logos</li>
                <li>• Dynamic web PWA support</li>
              </ul>
            </div>
            <a
              href="/onboarding?tier=pro"
              className="w-full rounded-md bg-[#00f2ff] py-2.5 text-center text-sm font-bold text-black shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-opacity hover:opacity-90"
            >
              Launch Pro
            </a>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-neutral-900 bg-neutral-900/50 p-8">
            <div>
              <h3 className="mb-2 text-xl font-bold">Enterprise</h3>
              <p className="mb-6 text-xs text-neutral-400">For major organizations</p>
              <ul className="mb-8 space-y-3 text-sm text-neutral-300">
                <li>• Dedicated native App Store submissions</li>
                <li>• Uncapped 4K extreme bitrate streams</li>
                <li>• Multi-tenant database clustering</li>
                <li>• 24/7 dedicated engineering support</li>
              </ul>
            </div>
            <a
              href="/onboarding?tier=enterprise"
              className="w-full rounded-md bg-neutral-800 py-2.5 text-center text-sm font-medium transition-colors hover:bg-neutral-700"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
