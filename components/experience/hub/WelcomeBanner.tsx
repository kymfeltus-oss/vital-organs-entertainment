"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  EXPERIENCE_HUB_LAYOUT,
  HUB_SPEC_COLORS,
  HUB_SPEC_GLOWS,
  MOTION_VARIANTS,
} from "@/lib/experience/hub-design-tokens";

export type WelcomeBannerUser = {
  firstName?: string;
  name?: string;
};

type WelcomeBannerProps = {
  user: WelcomeBannerUser;
  joinMessage?: string;
  className?: string;
};

function resolveFirstName(user: WelcomeBannerUser): string {
  if (user.firstName?.trim()) {
    return user.firstName.trim().split(/\s+/)[0]?.toUpperCase() ?? "GUEST";
  }
  if (user.name?.trim()) {
    return user.name.trim().split(/\s+/)[0]?.toUpperCase() ?? "GUEST";
  }
  return "GUEST";
}

export default function WelcomeBanner({
  user,
  joinMessage = "WE'RE SO GLAD YOU JOINED US TODAY.",
  className = "",
}: WelcomeBannerProps) {
  const reduceMotion = useReducedMotion();
  const firstName = resolveFirstName(user);
  const showName = Boolean(
    (user.firstName?.trim() && user.firstName.trim() !== "Guest") || user.name?.trim(),
  );

  return (
    <motion.div
      className={`mx-auto flex max-w-full items-center justify-center rounded-[20px] border border-white/10 bg-[rgba(5,8,18,0.88)] px-4 text-center sm:px-6 ${className}`}
      style={{
        width: "min(100%, clamp(560px, 52vw, 960px))",
        minHeight: EXPERIENCE_HUB_LAYOUT.welcome.height,
        boxShadow: HUB_SPEC_GLOWS.welcomeBanner,
      }}
      {...(reduceMotion
        ? {}
        : {
            animate: {
              boxShadow: [...MOTION_VARIANTS.welcomePulse.animate.boxShadow],
            },
            transition: MOTION_VARIANTS.welcomePulse.transition,
          })}
    >
      <p className="font-ui text-[0.7rem] font-semibold uppercase leading-snug tracking-[0.14em] sm:text-xs">
        {showName ? (
          <>
            <span style={{ color: HUB_SPEC_COLORS.hotPink }}>WELCOME {firstName}</span>
            <span className="mx-2 text-white/60" aria-hidden="true">
              |
            </span>
            <span className="text-white">{joinMessage}</span>
          </>
        ) : (
          <span className="text-white">{joinMessage}</span>
        )}
      </p>
    </motion.div>
  );
}
