import Link from "next/link";
import { SEED_PACKAGES, type SeedPackageId } from "@/lib/live-stream-routes";

type SeedsCheckoutPageProps = {
  searchParams: Promise<{ streamId?: string; package?: string }>;
};

function resolvePackage(value: string | undefined): SeedPackageId {
  if (value === "100" || value === "300" || value === "600" || value === "1200") {
    return value;
  }
  return "300";
}

/** Checkout landing for fullscreen live seed purchases. */
export default async function SeedsCheckoutPage({ searchParams }: SeedsCheckoutPageProps) {
  const params = await searchParams;
  const streamId = params.streamId?.trim() ?? "current";
  const packageId = resolvePackage(params.package);
  const selected = SEED_PACKAGES.find((pkg) => pkg.id === packageId) ?? SEED_PACKAGES[1];

  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-black px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-brand-panel/90 p-6 backdrop-blur-xl">
        <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.2em] text-brand-blue">
          Seed Checkout
        </p>
        <h1 className="mt-3 font-headline text-2xl uppercase tracking-[0.12em]">
          {selected.seeds.toLocaleString("en-US")} Seeds
        </h1>
        <p className="mt-2 font-body text-sm text-brand-muted">
          Stream: {streamId} · Total {selected.priceLabel}
        </p>
        <p className="mt-4 font-body text-sm text-brand-muted">
          TODO: Connect Stripe checkout for live seed packages.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/live/${encodeURIComponent(streamId)}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-brand-blue/40 bg-brand-blue/10 px-6 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-blue"
          >
            Back to Live
          </Link>
          <Link
            href="/buy-seeds"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white"
          >
            Open Seed Store
          </Link>
        </div>
      </div>
    </main>
  );
}
