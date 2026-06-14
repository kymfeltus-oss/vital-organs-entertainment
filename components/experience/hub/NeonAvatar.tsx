"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { HUB_SPEC_COLORS } from "@/lib/experience/hub-design-tokens";

type NeonAvatarProps = {
  initials?: string | null;
  menuHref: string;
  size?: number;
  className?: string;
};

export default function NeonAvatar({
  initials,
  menuHref,
  size = 44,
  className = "",
}: NeonAvatarProps) {
  const showAvatar = Boolean(initials?.trim());

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {showAvatar ? (
        <div
          className="relative flex items-center justify-center rounded-full bg-gradient-to-tr from-[#7B2DFF] to-[#00E6FF] p-[2px] shadow-[0_0_15px_rgba(0,230,255,0.3)] transition-transform duration-300 hover:scale-105"
          style={{ width: size, height: size }}
          aria-label={`Profile ${initials}`}
        >
          <div
            className="flex h-full w-full items-center justify-center rounded-full font-ui text-sm font-bold tracking-wider text-white"
            style={{ backgroundColor: HUB_SPEC_COLORS.bg }}
          >
            {initials}
          </div>
        </div>
      ) : null}

      <Link
        href={menuHref}
        className="touch-target self-end p-1 text-white/60 transition-colors hover:text-white lg:self-center"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Link>
    </div>
  );
}
