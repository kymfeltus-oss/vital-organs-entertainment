"use client";

type GoingLiveTransitionProps = {
  visible: boolean;
};

export default function GoingLiveTransition({ visible }: GoingLiveTransitionProps) {
  if (!visible) return null;

  return (
    <div
      className="experience-go-live-overlay fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/92 px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="experience-go-live-sweep" aria-hidden="true" />

      <div className="relative rounded-full border border-red-500/50 bg-red-500/10 px-6 py-2">
        <p className="font-ui text-[0.72rem] font-bold uppercase tracking-[0.24em] text-red-400">
          Live Now
        </p>
      </div>

      <p className="relative mt-6 font-headline text-3xl uppercase tracking-[0.16em] text-white sm:text-4xl">
        Opening Live Experience…
      </p>
      <p className="relative mt-2 font-body text-sm text-zinc-400">
        300 Awakening Live Experience
      </p>
    </div>
  );
}
