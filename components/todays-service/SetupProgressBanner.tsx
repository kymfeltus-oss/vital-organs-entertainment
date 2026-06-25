"use client";

import { memo, useMemo } from "react";
import { computeSetupProgress } from "@/lib/todays-service/coaching";
import type { TodaysServicePayload } from "@/lib/todays-service/types";
import { TS } from "@/components/todays-service/ServiceUi";

type SetupProgressBannerProps = {
  data: TodaysServicePayload;
  onContinueSetup: () => void;
};

function SetupProgressBanner({ data, onContinueSetup }: SetupProgressBannerProps) {
  const { completed, total, remaining } = useMemo(() => computeSetupProgress(data), [data]);
  const complete = remaining === 0;
  const percent = Math.round((completed / total) * 100);

  return (
    <section className={`${TS.panel} min-h-[7.5rem] rounded-xl p-4`} aria-live="polite" aria-atomic="true">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#00f2ff]">
            {complete ? "Church Setup Complete" : "Church Setup Progress"}
          </p>
          {complete ? (
            <p className="mt-1 font-body text-sm text-white/80">Everything has been configured.</p>
          ) : (
            <>
              <p className="mt-1 font-body text-sm text-white">
                <span className="font-semibold">
                  {completed} of {total} completed
                </span>
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#53fc18] transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 font-body text-[0.82rem] text-neutral-400">
                {remaining <= 2
                  ? `You're almost ready. Only ${remaining} step${remaining === 1 ? "" : "s"} left.`
                  : `${remaining} steps left to finish getting ready.`}
              </p>
            </>
          )}
        </div>
        {!complete ? (
          <button type="button" onClick={onContinueSetup} className={`shrink-0 ${TS.btnPrimary}`}>
            Continue Setup
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default memo(SetupProgressBanner);
