"use client";

type GoingLiveTransitionProps = {
  visible: boolean;
};

export default function GoingLiveTransition({ visible }: GoingLiveTransitionProps) {
  if (!visible) return null;

  return (
    <div
      className="experience-go-live-overlay fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-black/95 px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full border border-brand-pink/50 bg-brand-pink/15 px-5 py-2 neon-pink-glow">
        <p className="font-ui text-[0.7rem] font-bold uppercase tracking-[0.22em] text-brand-pink">
          Live Now
        </p>
      </div>
      <p className="mt-5 font-headline text-2xl uppercase tracking-[0.14em] text-white sm:text-3xl">
        Opening Live Experience…
      </p>
      <p className="mt-2 font-body text-sm text-brand-muted">
        300 Awakening Live Experience
      </p>
    </div>
  );
}
