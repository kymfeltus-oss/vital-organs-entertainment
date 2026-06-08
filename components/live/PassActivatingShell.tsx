import { Loader2 } from "lucide-react";

type PassActivatingShellProps = {
  attempt: number;
};

export default function PassActivatingShell({ attempt }: PassActivatingShellProps) {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#0B090A] px-6 pt-safe pb-safe text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,64,175,0.2),transparent_68%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(176,38,122,0.12),transparent_55%)]" />
      <div className="relative z-10 w-full max-w-md animate-pulse text-center [animation-duration:2s]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/10 shadow-[0_0_30px_rgba(30,64,175,0.35)]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
        </div>
        <p className="mt-8 text-[0.65rem] font-bold uppercase tracking-[0.32em] text-[#1E40AF]">
          Activating Your Pass
        </p>
        <h1 className="mt-4 text-xl font-bold uppercase tracking-widest text-white md:text-2xl">
          Securing Your Concert Access
        </h1>
        <p className="mt-4 text-sm text-zinc-400">
          Validating your ticket and preparing your personal live-room credentials...
        </p>
        {attempt > 1 && (
          <p className="mt-3 text-xs text-zinc-500">Verification scan {attempt} of 5</p>
        )}
      </div>
    </main>
  );
}
