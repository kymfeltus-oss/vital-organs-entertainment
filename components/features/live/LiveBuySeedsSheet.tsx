"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Gem, X } from "lucide-react";
import BuySeedsNativeForm from "@/components/buy-seeds/BuySeedsNativeForm";
import { useVocabulary } from "@/hooks/useVocabulary";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { formatChatDisplayName } from "@/lib/live/chat";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import {
  BUY_SEEDS_DEFAULT_PACKAGE_ID,
  type SeedPackageId,
} from "@/lib/seeds/assets";
import { useSeedCheckout } from "@/lib/useSeedCheckout";

type LiveBuySeedsSheetProps = {
  open: boolean;
  onClose: () => void;
  profile: AttendeeProfileSnapshot;
  seedBalance: number;
  signInHref?: string;
};

export default function LiveBuySeedsSheet({
  open,
  onClose,
  profile,
  seedBalance,
  signInHref = "/live",
}: LiveBuySeedsSheetProps) {
  const { vocabulary } = useVocabulary();
  const [selectedPackageId, setSelectedPackageId] =
    useState<SeedPackageId>(BUY_SEEDS_DEFAULT_PACKAGE_ID);

  const { isSubmitting, errorMessage, activePackageId, startCheckout, clearError } =
    useSeedCheckout();

  const isSignedIn = Boolean(profile.userId);
  const displayName = formatChatDisplayName({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
  });

  const handleSelectPackage = useCallback(
    (packageId: SeedPackageId) => {
      setSelectedPackageId(packageId);
      clearError();
    },
    [clearError],
  );

  const handleContinue = useCallback(() => {
    void startCheckout(selectedPackageId, { returnPath: "/live" });
  }, [selectedPackageId, startCheckout]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-buy-seeds-title"
        className="pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl border border-brand-blue/35 bg-[#070910]/96 shadow-[0_0_40px_rgba(0,168,255,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-3">
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.18em] text-brand-blue">
              {vocabulary.tokenShopLabel}
            </p>
            <h2
              id="live-buy-seeds-title"
              className="mt-1 font-headline text-lg uppercase tracking-[0.08em] text-white"
            >
              {vocabulary.tokenShopLabel}
            </h2>
            <p className="mt-1 font-body text-sm text-brand-muted">
              Choose a package and continue to secure checkout. Returning buyers may see saved
              payment details in Stripe.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white"
            aria-label="Close buy seeds"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-pink/35 bg-brand-pink/10 text-brand-pink">
                <Gem className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                  Current balance
                </p>
                <p className="font-ui text-base font-bold tabular-nums text-white">
                  {seedBalance.toLocaleString("en-US")} Seeds
                </p>
              </div>
            </div>
          </div>

          {isSignedIn ? (
            <div className="rounded-2xl border border-brand-blue/25 bg-brand-blue/10 px-4 py-3">
              <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-blue">
                Checkout as
              </p>
              <p className="mt-1 font-body text-sm font-semibold text-white">{displayName}</p>
              {profile.email ? (
                <p className="mt-0.5 truncate font-body text-xs text-brand-muted">{profile.email}</p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-brand-pink/30 bg-brand-pink/10 px-4 py-3">
              <p className="font-body text-sm text-white/90">
                Sign in first so we can use your saved profile and any prior purchase info at
                checkout.
              </p>
              <Link
                href={buildAttendeeGateUrl(signInHref)}
                className="touch-target mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-brand-blue/40 bg-brand-blue/15 px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-blue"
              >
                Sign in to continue
              </Link>
            </div>
          )}

          {isSignedIn ? (
            <BuySeedsNativeForm
              selectedPackageId={selectedPackageId}
              isSubmitting={isSubmitting}
              activePackageId={activePackageId}
              errorMessage={errorMessage}
              onSelectPackage={handleSelectPackage}
              onContinue={handleContinue}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
