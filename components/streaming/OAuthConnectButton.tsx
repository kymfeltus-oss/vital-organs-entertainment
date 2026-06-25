"use client";

import { TS } from "@/components/todays-service/ServiceUi";

type OAuthConnectButtonProps = {
  label?: string;
  disabled?: boolean;
  developmentMessage?: string | null;
  onConnect: () => void;
};

export default function OAuthConnectButton({
  label = "Connect Account",
  disabled,
  developmentMessage,
  onConnect,
}: OAuthConnectButtonProps) {
  return (
    <div>
      {developmentMessage ? (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 font-body text-sm text-white/75">
          <p>{developmentMessage}</p>
          <p className="mt-2 text-xs text-white/55">You can:</p>
          <ul className="mt-1 list-inside list-disc text-xs text-white/55">
            <li>Add OAuth credentials</li>
            <li>Use Custom Streaming Server</li>
            <li>Continue setup and connect later</li>
          </ul>
        </div>
      ) : null}
      <button type="button" disabled={disabled || Boolean(developmentMessage)} onClick={onConnect} className={TS.btnPrimary}>
        {label}
      </button>
    </div>
  );
}
