import {
  VITAL_SEED_PAGE_BACKGROUND,
  VITAL_SEED_PAGE_BACKGROUND_MOBILE,
} from "@/lib/data/vital-seed";

export default function ExperienceGivingPage() {
  return (
    <main className="relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-black">
      <picture
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 block h-full w-full bg-brand-black"
      >
        <source
          media="(max-width: 767px) and (orientation: portrait)"
          srcSet={VITAL_SEED_PAGE_BACKGROUND_MOBILE}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={VITAL_SEED_PAGE_BACKGROUND}
          alt=""
          className="h-full w-full object-contain object-center"
        />
      </picture>
    </main>
  );
}
