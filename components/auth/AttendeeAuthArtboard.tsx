import type { CSSProperties, ReactNode } from "react";
import {
  AWAKENING_AUTH_ASSETS,
  AWAKENING_AUTH_LOGIN_ART,
} from "@/lib/experience/awakening-auth-assets";

type AttendeeAuthArtboardProps = {
  children: ReactNode;
  /** Background plate — defaults to attendee login PNG. */
  backgroundSrc?: string;
  scrollable?: boolean;
};

export default function AttendeeAuthArtboard({
  children,
  backgroundSrc = AWAKENING_AUTH_ASSETS.attendeeLoginPlate,
  scrollable = false,
}: AttendeeAuthArtboardProps) {
  return (
    <div
      className={`auth-attendee-stage${scrollable ? " auth-attendee-stage--scroll" : ""}`}
    >
      <div
        className="auth-attendee-artboard"
        style={
          {
            "--auth-art-w": AWAKENING_AUTH_LOGIN_ART.width,
            "--auth-art-h": AWAKENING_AUTH_LOGIN_ART.height,
          } as CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundSrc}
          alt=""
          width={AWAKENING_AUTH_LOGIN_ART.width}
          height={AWAKENING_AUTH_LOGIN_ART.height}
          className="auth-attendee-artboard__img"
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div className="auth-attendee-overlay">{children}</div>
      </div>
    </div>
  );
}
