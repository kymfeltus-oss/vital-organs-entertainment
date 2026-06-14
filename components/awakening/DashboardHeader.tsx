import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { AWAKENING_ASSETS, AWAKENING_COLORS } from "@/components/awakening/constants";

type DashboardHeaderProps = {
  welcomeName: string;
  initials: string;
  menuHref: string;
};

export default function DashboardHeader({ welcomeName, initials, menuHref }: DashboardHeaderProps) {
  return (
    <header className="relative grid min-h-[88px] grid-cols-[minmax(110px,180px)_1fr_minmax(64px,88px)] items-start gap-3 md:gap-4">
      <div className="relative h-[clamp(86px,10vw,140px)] w-[clamp(110px,12vw,180px)] shrink-0 justify-self-start pt-1">
        <Image
          src={AWAKENING_ASSETS.logo}
          alt="300 Awakening"
          fill
          priority
          sizes="(max-width: 768px) 110px, 180px"
          className="object-contain object-left drop-shadow-[0_0_18px_rgba(0,230,255,0.35)]"
        />
      </div>

      <div className="justify-self-center self-start pt-1">
        <div
          className="flex min-h-[56px] w-[min(640px,calc(100vw-16rem))] items-center justify-center rounded-full px-4 backdrop-blur-md md:min-h-[58px] md:px-6"
          style={{
            background: `linear-gradient(${AWAKENING_COLORS.black}cc, ${AWAKENING_COLORS.black}cc) padding-box, linear-gradient(90deg, ${AWAKENING_COLORS.pink}, ${AWAKENING_COLORS.purple}, ${AWAKENING_COLORS.cyan}) border-box`,
            border: "1px solid transparent",
            boxShadow: `0 0 24px ${AWAKENING_COLORS.pink}55, 0 0 40px rgba(0,230,255,0.18)`,
          }}
        >
          <p className="text-center font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] md:text-[0.78rem]">
            <span style={{ color: AWAKENING_COLORS.pink }}>WELCOME {welcomeName}</span>
            <span className="text-white"> | WE&apos;RE SO GLAD YOU JOINED US TODAY.</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 justify-self-end">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: `linear-gradient(${AWAKENING_COLORS.black}ee, ${AWAKENING_COLORS.black}ee) padding-box, linear-gradient(135deg, ${AWAKENING_COLORS.pink}, ${AWAKENING_COLORS.magenta}) border-box`,
            border: "2px solid transparent",
            boxShadow: `0 0 22px ${AWAKENING_COLORS.pink}66`,
          }}
          aria-label={`Profile ${initials}`}
        >
          <span className="font-ui text-sm font-bold uppercase tracking-[0.1em]">{initials}</span>
        </div>
        <Link
          href={menuHref}
          className="touch-target flex h-10 w-10 items-center justify-center text-white/90 transition hover:text-[#00E6FF]"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" strokeWidth={2.2} />
        </Link>
      </div>
    </header>
  );
}
