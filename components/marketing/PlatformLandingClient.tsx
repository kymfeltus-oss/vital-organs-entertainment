"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Palette, Sparkles } from "lucide-react";
import { PLATFORM_SAAS_TIERS } from "@/lib/platform/saas-tiers";
import { PLATFORM_TAGLINE } from "@/lib/theme/brand";

const STOREFRONT_FEATURES = [
  {
    icon: Sparkles,
    title: "Dynamic themes",
    copy: "Tenant-aware palette tokens, typography, and layout variables applied instantly across the workspace.",
  },
  {
    icon: Palette,
    title: "Custom brand assets",
    copy: "Upload logos, favicons, and hero media mapped directly to your white-label attendee experience.",
  },
  {
    icon: MessageCircle,
    title: "Live streaming chat",
    copy: "Real-time fellowship chat, reactions, and monetization layers built for broadcast-grade events.",
  },
] as const;

export default function PlatformLandingClient() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const startCheckout = async (tierId: string, contactSales?: boolean) => {
    if (contactSales) {
      window.location.assign("/contact-us?intent=enterprise");
      return;
    }

    setLoadingTier(tierId);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/billing/platform-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });

      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Unable to start checkout.");
      }

      window.location.assign(result.url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed.");
      setLoadingTier(null);
    }
  };

  return (
    <div className="platform-landing min-h-dvh w-full overflow-x-hidden bg-[#020203] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-80"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 18% 0%, rgba(0,168,255,0.16), transparent 34%), radial-gradient(circle at 82% 8%, rgba(255,47,175,0.14), transparent 32%), linear-gradient(180deg, #050507 0%, #020203 52%, #010102 100%)",
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div>
          <p className="font-headline text-2xl uppercase tracking-[0.18em] text-white">Parable</p>
          <p className="font-ui text-xs uppercase tracking-[0.22em] text-white/55">Streaming</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/onboarding"
            className="rounded-full border border-white/15 px-4 py-2 font-ui text-xs font-semibold uppercase tracking-[0.12em] text-white/80 transition hover:border-white/35 hover:text-white"
          >
            Register network
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-4 py-2 font-ui text-xs font-semibold uppercase tracking-[0.12em] text-white/80 transition hover:border-white/35 hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main id="main-content" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <section className="mx-auto max-w-3xl text-center">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.28em] text-[#00a8ff]">
            B2B SaaS storefront
          </p>
          <h1 className="mt-4 font-headline text-[clamp(2rem,7vw,3.75rem)] uppercase leading-[0.95] tracking-[0.04em] text-white">
            Launch Your Own Branded Streaming Network
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-body text-base leading-relaxed text-white/72 md:text-lg">
            Provision a tenant subdomain for your audience while you manage branding, live production,
            and monetization from a single white-label control plane.
          </p>
          <p className="mt-2 font-ui text-sm text-white/50">{PLATFORM_TAGLINE}</p>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {STOREFRONT_FEATURES.map(({ icon: Icon, title, copy }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
            >
              <div className="mb-3 inline-flex rounded-xl bg-white/5 p-2.5 text-[#00a8ff]">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-card-title text-lg uppercase tracking-[0.08em] text-white">{title}</h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-white/65">{copy}</p>
            </article>
          ))}
        </section>

        <section className="mt-16">
          <div className="mb-8 text-center">
            <h2 className="font-headline text-3xl uppercase tracking-[0.1em] text-white md:text-4xl">
              Subscription tiers
            </h2>
            <p className="mt-2 font-body text-sm text-white/60">
              Provision a tenant subdomain after checkout. Viewers hit your cinematic intro — not this page.
            </p>
          </div>

          {checkoutError ? (
            <p className="mb-6 rounded-xl border border-[#ff2faf]/35 bg-[#ff2faf]/10 px-4 py-3 text-center font-ui text-sm text-[#ffb8e8]">
              {checkoutError}
            </p>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-3">
            {PLATFORM_SAAS_TIERS.map((tier) => (
              <article
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  tier.featured
                    ? "border-[#8a2eff]/60 bg-gradient-to-b from-[#8a2eff]/12 to-transparent shadow-[0_0_40px_rgba(138,46,255,0.18)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {tier.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#00a8ff] via-[#8a2eff] to-[#ff2faf] px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                    Most popular
                  </span>
                ) : null}

                <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                  {tier.name}
                </p>
                <p className="mt-3 font-headline text-4xl uppercase leading-none text-white">
                  {tier.priceLabel}
                </p>
                <p className="font-ui text-xs uppercase tracking-[0.14em] text-white/45">
                  {tier.priceSubtext}
                </p>
                <p className="mt-4 font-body text-sm leading-relaxed text-white/70">{tier.description}</p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {tier.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 font-body text-sm text-white/78">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#00a8ff]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={loadingTier !== null}
                  onClick={() => void startCheckout(tier.id, tier.contactSales)}
                  className={`mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 font-ui text-xs font-bold uppercase tracking-[0.14em] transition disabled:cursor-wait disabled:opacity-60 ${
                    tier.featured
                      ? "bg-gradient-to-r from-[#00a8ff] via-[#8a2eff] to-[#ff2faf] text-white shadow-[0_0_24px_rgba(0,168,255,0.25)] hover:brightness-110"
                      : "border border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  {loadingTier === tier.id
                    ? "Redirecting…"
                    : tier.contactSales
                      ? "Request Access"
                      : "Request Access / Start Trial"}
                  {!tier.contactSales ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center md:p-10">
          <h2 className="font-headline text-2xl uppercase tracking-[0.12em] text-white md:text-3xl">
            Ready to launch your tenant?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-white/68 md:text-base">
            Business clients purchase on the apex domain. Daily viewers experience your branded subdomain
            intro, email gate, and attendee dashboard — automatically.
          </p>
          <button
            type="button"
            disabled={loadingTier !== null}
            onClick={() => void startCheckout("pro")}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00a8ff] via-[#8a2eff] to-[#ff2faf] px-8 font-ui text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_28px_rgba(255,47,175,0.22)] transition hover:brightness-110 disabled:opacity-60"
          >
            {loadingTier === "pro" ? "Redirecting…" : "Request Access / Start Trial"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </section>
      </main>
    </div>
  );
}
