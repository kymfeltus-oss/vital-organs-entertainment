"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EnterpriseContactPage() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent") || "general";
  const tenantSlug = searchParams.get("tenant")?.trim() ?? "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tenantSlug && !organization) {
      setOrganization(tenantSlug);
    }
  }, [organization, tenantSlug]);

  const handleContactSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("platform_inquiries").insert([
        {
          full_name: fullName,
          email: email,
          organization: organization,
          intent_tier: intent,
          message_body: message,
          status: "pending",
          tenant_id: tenantSlug || null,
        },
      ]);

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error("Inquiry delivery network failure.", err);
      window.alert("Transmission failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-y-auto bg-[#000000] pb-16 font-sans text-white selection:bg-[#6C4DFF]">
      <div className="pointer-events-none absolute left-1/2 top-[10%] z-0 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FF0F8E]/10 via-[#6C4DFF]/10 to-[#00C2FF]/5 blur-[120px]" />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#0c0e1a_1px,transparent_1px),linear-gradient(to_bottom,#0c0e1a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)]" />

      <nav className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-neutral-900/60 bg-black/10 px-8 py-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-[#FF0F8E] shadow-[0_0_12px_#FF0F8E]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            PΛRΛBLE CORE CONSOLE
          </span>
        </div>
        <a
          href="/"
          className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-white"
        >
          ← Return to Network Core
        </a>
      </nav>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12">
        <div className="relative w-full overflow-hidden rounded-3xl border border-neutral-900/80 bg-neutral-950/40 p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl md:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF0F8E]/30 to-transparent" />

          <header className="mb-10 text-left">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.4em] text-[#FF0F8E]">
              {intent === "enterprise" ? "03 // ENTERPRISE AGREEMENT REQUEST" : "GENERAL INQUIRY NODE"}
            </p>
            <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white">
              Connect with Infrastructure Support
            </h1>
            <p className="text-xs font-light leading-relaxed text-neutral-400">
              Submit your network deployment configuration requirements below. Our systems operations
              team will evaluate your protocol parameters and initialize contact routes.
            </p>
          </header>

          {success ? (
            <div className="space-y-3 rounded-2xl border border-[#00C2FF]/20 bg-neutral-900/40 p-6 text-center">
              <div className="text-sm font-bold text-white">Transmission Successful</div>
              <p className="mx-auto max-w-sm text-xs leading-relaxed text-neutral-400">
                Your procurement specification details have been securely logged into our pending
                communication rows. A systems engineer will respond shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={(event) => void handleContactSubmit(event)} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    placeholder="Alex Mercer"
                    className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 text-xs text-white placeholder-neutral-700 transition-colors focus:border-[#FF0F8E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 text-xs text-white transition-colors focus:border-[#FF0F8E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Organization / Network Title
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  required
                  placeholder="e.g., Vanguard Media Group"
                  className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 text-xs text-white placeholder-neutral-700 transition-colors focus:border-[#FF0F8E] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Deployment Specifications & Messages
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  placeholder="Detail your required stream bitrates, anticipated concurrent user thresholds, hardware mixing pipeline structures, or custom native application needs..."
                  className="w-full resize-none rounded-xl border border-neutral-900 bg-black px-4 py-3 text-xs leading-relaxed text-white placeholder-neutral-700 transition-colors focus:border-[#FF0F8E] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-white text-xs font-bold uppercase tracking-widest text-black shadow-md transition-all duration-300 hover:bg-neutral-200 disabled:opacity-40"
              >
                {loading ? "Transmitting Specifications..." : "Submit Network Requirements"}
              </button>
            </form>
          )}

          <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-neutral-900/60 pt-6 font-mono text-[10px] text-neutral-500 sm:flex-row sm:items-center">
            <span>
              Direct Ops Route:{" "}
              <a
                href="mailto:ops@parablestream.com"
                className="text-neutral-400 transition-colors hover:text-white"
              >
                ops@parablestream.com
              </a>
            </span>
            <span className="uppercase tracking-wider text-neutral-600">Sovereign Encryption Verified</span>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-7xl border-t border-neutral-900/40 py-6 text-center font-mono text-[9px] uppercase tracking-[0.4em] text-neutral-600">
        SYSTEM CONSOLE ONLINE // PROCUREMENT SECURED
      </footer>
    </div>
  );
}
