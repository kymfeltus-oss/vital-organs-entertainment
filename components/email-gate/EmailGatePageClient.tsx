"use client";

import type { CSSProperties } from "react";
import EmailGateOverlay from "@/components/email-gate/EmailGateOverlay";
import { EMAIL_GATE_ASSETS, EMAIL_GATE_MOBILE_ART } from "@/lib/email-gate/assets";

export default function EmailGatePageClient() {
  return (
    <div className="email-gate-page email-gate-page--mobile">
      <div
        className="email-gate-page__stage"
        style={
          {
            "--email-gate-art-w": EMAIL_GATE_MOBILE_ART.width,
            "--email-gate-art-h": EMAIL_GATE_MOBILE_ART.height,
          } as CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={EMAIL_GATE_ASSETS.background}
          alt="300 Awakening — choose your entry path"
          width={EMAIL_GATE_MOBILE_ART.width}
          height={EMAIL_GATE_MOBILE_ART.height}
          className="email-gate-page__bg"
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <EmailGateOverlay />
      </div>
    </div>
  );
}
