import { VITAL_SEED_PAGE_BACKGROUND } from "@/lib/data/vital-seed";

export default function ExperienceGivingPage() {
  return (
    <main className="relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={VITAL_SEED_PAGE_BACKGROUND}
        alt=""
        className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover object-center"
      />
    </main>
  );
}
