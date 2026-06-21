import type { CSSProperties, ReactNode } from "react";
import {
  AWAKENING_AUTH_ASSETS,
  AWAKENING_AUTH_LOGIN_ART,
} from "@/lib/experience/awakening-auth-assets";
import {
  MOBILE_ARTBOARD_ART_FIT,
  MOBILE_ARTBOARD_FULL_SHELL,
  MOBILE_ARTBOARD_STAGE,
  mobileArtboardStageStyle,
} from "@/lib/responsive";

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
};

export default function AttendeeAuthArtboard({
  children,
  backgroundSrc = AWAKENING_AUTH_ASSETS.attendeeLoginPlate,
  artboard = AWAKENING_AUTH_LOGIN_ART,
}: AttendeeAuthArtboardProps) {
  return (
    <div className={`auth-attendee-stage ${MOBILE_ARTBOARD_FULL_SHELL} min-h-0 w-full flex-1`}>
      <div
        className={`auth-attendee-artboard ${MOBILE_ARTBOARD_STAGE}`}
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
        <div className={MOBILE_ARTBOARD_ART_FIT}>
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
          {children}
        </div>
      </div>
    </div>
  );
}

export type { AuthArtboardSpec };
