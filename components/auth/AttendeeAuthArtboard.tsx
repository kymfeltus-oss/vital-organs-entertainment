import type { ReactNode } from "react";
import {
  AWAKENING_AUTH_ASSETS,
  AWAKENING_AUTH_LOGIN_ART,
} from "@/lib/experience/awakening-auth-assets";

type AttendeeAuthArtboardProps = {
  children: ReactNode;
};

export default function AttendeeAuthArtboard({ children }: AttendeeAuthArtboardProps) {
  return (
    <main className="auth-attendee-stage pt-safe pb-safe">
      <div
        className="auth-attendee-artboard"
        style={{
          aspectRatio: `${AWAKENING_AUTH_LOGIN_ART.width} / ${AWAKENING_AUTH_LOGIN_ART.height}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AWAKENING_AUTH_ASSETS.attendeeLoginPlate}
          alt=""
          width={AWAKENING_AUTH_LOGIN_ART.width}
          height={AWAKENING_AUTH_LOGIN_ART.height}
          className="auth-attendee-artboard__img"
          decoding="async"
        />
        <div className="auth-attendee-overlay">{children}</div>
      </div>
    </main>
  );
}
