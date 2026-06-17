import Image from "next/image";
import {
  VITAL_SEED_GIVING_ASSETS,
  VITAL_SEED_GIVING_DESKTOP_ART,
  VITAL_SEED_GIVING_MOBILE_ART,
} from "@/lib/vital-seed/giving-assets";

export default function ExperienceGivingPageClient() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-brand-black pt-safe pb-safe">
      <div className="vital-giving-stage">
        <div className="vital-giving-artboard vital-giving-artboard--desktop hidden lg:block">
          <Image
            src={VITAL_SEED_GIVING_ASSETS.desktopBackground}
            alt=""
            width={VITAL_SEED_GIVING_DESKTOP_ART.width}
            height={VITAL_SEED_GIVING_DESKTOP_ART.height}
            priority
            sizes="100vw"
            className="vital-giving-artboard__img"
          />
        </div>

        <div className="vital-giving-artboard vital-giving-artboard--mobile lg:hidden">
          <Image
            src={VITAL_SEED_GIVING_ASSETS.mobileBackground}
            alt=""
            width={VITAL_SEED_GIVING_MOBILE_ART.width}
            height={VITAL_SEED_GIVING_MOBILE_ART.height}
            priority
            sizes="100vw"
            className="vital-giving-artboard__img"
          />
        </div>
      </div>
    </main>
  );
}
