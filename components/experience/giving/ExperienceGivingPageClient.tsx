import Image from "next/image";
import { VITAL_SEED_GIVING_ASSETS } from "@/lib/vital-seed/giving-assets";

export default function ExperienceGivingPageClient() {
  return (
    <main className="relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-black">
      <Image
        src={VITAL_SEED_GIVING_ASSETS.desktopBackground}
        alt=""
        fill
        priority
        sizes="100vw"
        className="hidden object-cover object-center lg:block"
      />
      <Image
        src={VITAL_SEED_GIVING_ASSETS.mobileBackground}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center lg:hidden"
      />
    </main>
  );
}
