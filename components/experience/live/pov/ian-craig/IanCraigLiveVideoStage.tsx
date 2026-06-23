"use client";

import AttendeeStreamPlayer from "@/components/experience/live/AttendeeStreamPlayer";

type IanCraigLiveVideoStageProps = {
  enabled: boolean;
};

export default function IanCraigLiveVideoStage({ enabled }: IanCraigLiveVideoStageProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-brand-black">
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#1a0a2e] via-[#2d1045] to-[#0a1628]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_28%,rgba(255,255,255,0.14),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_100%,rgba(138,46,255,0.22),transparent_55%)]" />
      </div>

      <div className="absolute inset-0 z-[1]">
        <AttendeeStreamPlayer enabled={enabled} showPaywall={false} embedded />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/75 via-transparent to-black/45"
        aria-hidden="true"
      />
    </div>
  );
}
