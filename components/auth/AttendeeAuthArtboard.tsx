import type { CSSProperties, ReactNode } from "react";
import {
  AWAKENING_AUTH_ASSETS,
  AWAKENING_AUTH_LOGIN_ART,
} from "@/lib/experience/awakening-auth-assets";
import { mobileArtboardStageStyle } from "@/lib/responsive";

type AuthArtboardSpec = {
  width: number;
  height: number;
};

type AttendeeAuthArtboardProps = {
  children: ReactNode;
  /** Background plate — defaults to attendee login PNG. */
  backgroundSrc?: string;
  /** Artboard pixel size — must match the PNG aspect ratio. */
  artboard?: AuthArtboardSpec;
  scrollable?: boolean;
};

export default function AttendeeAuthArtboard({
  children,
  backgroundSrc = AWAKENING_AUTH_ASSETS.attendeeLoginPlate,
  artboard = AWAKENING_AUTH_LOGIN_ART,
  scrollable = false,
}: AttendeeAuthArtboardProps) {
  return (
    <div
      className={`auth-attendee-stage${scrollable ? " auth-attendee-stage--scroll" : ""}`}
    >
      <div
        className="auth-attendee-artboard"
        style={
          mobileArtboardStageStyle({
            native: artboard,
            extra: {
              "--auth-art-w": artboard.width,
              "--auth-art-h": artboard.height,
            },
          }) as CSSProperties
        }
      >
        <div className="mobile-artboard-art-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundSrc}
            alt=""
            width={artboard.width}
            height={artboard.height}
            className="auth-attendee-artboard__img"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <div className="auth-attendee-overlay">{children}</div>
        </div>
      </div>
    </div>
  );
}

export type { AuthArtboardSpec };
