"use client";

import type { CSSProperties } from "react";
import EmailGateOverlay from "@/components/email-gate/EmailGateOverlay";
import { EMAIL_GATE_ASSETS, EMAIL_GATE_MOBILE_ART_NATIVE } from "@/lib/email-gate/assets";
import {
  MOBILE_ARTBOARD_ART_FIT,
  MOBILE_ARTBOARD_FULL_SHELL,
  MOBILE_ARTBOARD_STAGE,
  mobileArtboardStageStyle,
} from "@/lib/responsive";

export default function EmailGatePageClient() {
  return (
    <div className={`email-gate-page email-gate-page--mobile ${MOBILE_ARTBOARD_FULL_SHELL}`}>
      <div
        className={`email-gate-page__stage ${MOBILE_ARTBOARD_STAGE}`}
        style={mobileArtboardStageStyle({ native: EMAIL_GATE_MOBILE_ART_NATIVE }) as CSSProperties}
      >
        <div className={MOBILE_ARTBOARD_ART_FIT}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={EMAIL_GATE_ASSETS.background}
            alt="300 Awakening — choose your entry path"
            width={EMAIL_GATE_MOBILE_ART_NATIVE.width}
            height={EMAIL_GATE_MOBILE_ART_NATIVE.height}
            className="email-gate-page__bg"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <EmailGateOverlay />
        </div>
      </div>
    </div>
  );
}
