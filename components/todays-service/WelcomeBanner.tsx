"use client";

import { Sparkles } from "lucide-react";
import { markWelcomeComplete } from "@/lib/todays-service/coaching";
import { TS } from "@/components/todays-service/ServiceUi";

type WelcomeBannerProps = {
  onStartGuidedSetup: () => void;
};

export default function WelcomeBanner({ onStartGuidedSetup }: WelcomeBannerProps) {
  return (
    <section
      className={`${TS.panel} rounded-xl border-[#00f2ff]/25 p-5 shadow-[0_0_24px_rgba(0,242,255,0.1)]`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-[#00f2ff]" aria-hidden="true" />
          <div>
            <h2 className="font-headline text-lg uppercase tracking-[0.08em] text-white">
              Welcome to Parable!
            </h2>
            <p className="mt-1 font-body text-[0.88rem] leading-relaxed text-gray-400">
              We&apos;ll help you get your church ready for livestreaming.
            </p>
            <p className="mt-2 font-body text-[0.82rem] text-white/70">
              Estimated setup time:{" "}
              <span className="font-semibold text-white">10 to 15 minutes</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            markWelcomeComplete();
            onStartGuidedSetup();
          }}
          className={`shrink-0 ${TS.btnPrimary}`}
        >
          Start Guided Setup
        </button>
      </div>
    </section>
  );
}
