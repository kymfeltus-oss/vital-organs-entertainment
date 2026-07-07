"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function OnboardingPage() {
  const [subdomain, setSubdomain] = useState("");
  const [appName, setAppName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#00f2ff");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    if (!cleanSubdomain || !appName) {
      setErrorMsg("Please fill out all fields.");
      setLoading(false);
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("tenant_themes")
        .select("tenant_id")
        .eq("tenant_id", cleanSubdomain)
        .maybeSingle();

      if (existing) {
        setErrorMsg("Subdomain name is already taken.");
        setLoading(false);
        return;
      }

      const accentGlow = `${primaryColor}80`;
      const placeholderEmail = `pending+${cleanSubdomain}@onboarding.local`;

      const { error: insertError } = await supabase.from("tenant_themes").insert({
        tenant_id: cleanSubdomain,
        company_name: appName,
        owner_email: placeholderEmail,
        app_name: appName,
        primary_color: primaryColor,
        colors: {
          primary: primaryColor,
          accent: primaryColor,
          accentGlow,
        },
        logo_url: "/tenant-default/dashboard/logo.png",
      });

      if (insertError) throw insertError;

      const tier =
        new URLSearchParams(window.location.search).get("tier")?.trim().toLowerCase() || "starter";

      if (tier === "enterprise") {
        window.location.href = `/contact-us?intent=enterprise&tenant=${cleanSubdomain}`;
        return;
      }

      const checkoutResponse = await fetch("/api/billing/platform-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          tenantId: cleanSubdomain,
        }),
      });

      const checkoutResult = (await checkoutResponse.json()) as { url?: string; error?: string };
      if (!checkoutResponse.ok || !checkoutResult.url) {
        throw new Error(checkoutResult.error ?? "Unable to start subscription checkout.");
      }

      window.location.href = checkoutResult.url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 bg-neutral-950 p-6 font-sans text-white lg:flex-row">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <h2 className="mb-1 text-2xl font-bold tracking-tight">Build Your Network</h2>
        <p className="mb-6 text-sm text-neutral-400">Set up your deployment configs and design styles.</p>

        {errorMsg ? (
          <div className="mb-4 rounded border border-red-900 bg-red-950/50 p-3 text-sm text-red-400">
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Network Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(event) =>
                setAppName(event.target.value.replace(/\b\w/g, (char) => char.toUpperCase()))
              }
              required
              placeholder="e.g., Vanguard Streaming"
              className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm focus:border-[#00f2ff] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Network Subdomain
            </label>
            <div className="flex overflow-hidden rounded border border-neutral-800 bg-neutral-950 focus-within:border-[#00f2ff]">
              <input
                type="text"
                value={subdomain}
                onChange={(event) => setSubdomain(event.target.value)}
                required
                placeholder="vanguard"
                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
              />
              <span className="border-l border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-500">
                .yourplatform.com
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="h-10 w-10 cursor-pointer rounded border-0 bg-transparent"
              />
              <span className="font-mono text-sm uppercase tracking-widest text-neutral-300">
                {primaryColor}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 h-10 w-full rounded bg-white text-sm font-semibold text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? "Deploying Infrastructure..." : "Launch Custom Network"}
          </button>
        </form>
      </div>

      <div
        className="relative flex aspect-[9/19] w-full max-w-[340px] flex-col justify-between overflow-hidden rounded-[40px] border-[10px] border-neutral-800 bg-black p-4 shadow-2xl"
        style={{ boxShadow: `0 0 40px ${primaryColor}15` }}
      >
        <div className="absolute left-1/2 top-0 z-20 h-5 w-32 -translate-x-1/2 rounded-b-2xl bg-neutral-800" />

        <div className="z-10 flex flex-1 flex-col justify-between pt-6 text-center">
          <div>
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-xl font-bold"
              style={{ color: primaryColor }}
            >
              {appName ? appName.charAt(0).toUpperCase() : "N"}
            </div>
            <h3 className="max-w-full truncate px-2 text-lg font-bold tracking-tight">
              {appName || "Your Network"}
            </h3>
            <p className="mt-0.5 text-[11px] uppercase tracking-widest text-neutral-500">
              Live Media Player
            </p>
          </div>

          <div className="group relative my-4 flex aspect-video w-full items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-black transition-transform"
              style={{ backgroundColor: primaryColor, boxShadow: `0 0 15px ${primaryColor}` }}
            >
              ▶
            </div>
          </div>

          <div className="mb-4 space-y-2">
            <div
              className="flex h-9 items-center justify-center rounded text-xs font-semibold text-black"
              style={{ backgroundColor: primaryColor }}
            >
              Enter Email To Watch
            </div>
            <div className="mx-auto h-3 w-2/3 rounded bg-neutral-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
