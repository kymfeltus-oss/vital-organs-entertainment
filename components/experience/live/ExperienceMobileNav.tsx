"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ExperienceActionId } from "@/components/experience/live/experience-actions";

type ExperienceMobileNavProps = {
  activeAction: ExperienceActionId;
  onActionTrigger: (action: Exclude<ExperienceActionId, null>) => void;
};

export default function ExperienceMobileNav({
  activeAction,
  onActionTrigger,
}: ExperienceMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const onLiveRoute = pathname === "/experience/live";

  return (
    <nav
      className="relative z-40 w-full shrink-0 select-none border-t border-white/[0.06] bg-[#0E0E10] pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Live experience navigation"
    >
      <div className="grid h-11 w-full grid-cols-3 items-center border-b border-white/[0.04]">
        <Link
          href="/experience/live"
          className="relative flex h-full flex-col items-center justify-center"
        >
          <span
            className={`font-ui text-[10px] font-black tracking-widest ${
              onLiveRoute ? "text-white" : "text-zinc-500"
            }`}
          >
            LIVE
          </span>
          {onLiveRoute ? (
            <span
              className="absolute bottom-0 h-[2px] w-6 bg-[#B0267A] shadow-[0_0_8px_#B0267A]"
              aria-hidden="true"
            />
          ) : null}
        </Link>

        <button
          type="button"
          onClick={() => router.push("/dashboard/merch")}
          className="flex h-full flex-col items-center justify-center"
        >
          <span className="font-ui text-[10px] font-black tracking-widest text-zinc-500">
            MERCH
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard/vital-seed")}
          className="flex h-full flex-col items-center justify-center"
        >
          <span className="font-ui text-[10px] font-black tracking-widest text-zinc-500">
            VITAL SEED
          </span>
        </button>
      </div>

      <div className="grid h-10 w-full grid-cols-3 items-center pt-1 font-ui text-[9px] font-bold text-zinc-400">
        <button
          type="button"
          onClick={() => onActionTrigger("prayer")}
          className={`touch-target transition hover:text-white ${
            activeAction === "prayer" ? "text-[#3B82F6]" : ""
          }`}
        >
          Prayer
        </button>
        <button
          type="button"
          onClick={() => onActionTrigger("give")}
          className={`touch-target font-black transition hover:text-white ${
            activeAction === "give" ? "text-[#B0267A]" : ""
          }`}
        >
          Give
        </button>
        <button
          type="button"
          onClick={() => onActionTrigger("program")}
          className={`touch-target transition hover:text-white ${
            activeAction === "program" ? "text-white" : ""
          }`}
        >
          Program
        </button>
      </div>
    </nav>
  );
}
