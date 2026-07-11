"use client";

type LivGeoComplianceBannerProps = {
  status: "locating" | "checking" | "ineligible" | "unavailable" | "unsupported";
  message: string;
  onRetry?: () => void;
};

export default function LivGeoComplianceBanner({
  status,
  message,
  onRetry,
}: LivGeoComplianceBannerProps) {
  const title =
    status === "locating" || status === "checking"
      ? "Verifying Regional Compliance"
      : "Prop Wagering Unavailable";

  return (
    <aside className="flex h-full w-full min-w-[320px] flex-col justify-center bg-[#161616] p-6">
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-200">
          {title}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-200">{message}</p>
        <p className="mt-4 text-xs text-zinc-500">
          LIV Golf prop modules and token wallets are geo-fenced per local wagering jurisdictions.
          Live stream viewing remains available.
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={() => void onRetry()}
            className="mt-5 rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:border-[#CCFF00]/40"
          >
            Re-check Location
          </button>
        ) : null}
      </div>
    </aside>
  );
}
