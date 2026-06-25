"use client";

type TodaysServiceLiveStatusProps = {
  connection: "connected" | "disconnected" | "connecting";
};

export default function TodaysServiceLiveStatus({ connection }: TodaysServiceLiveStatusProps) {
  const label = connection === "connected" ? "Connected" : "Reconnecting…";

  return (
    <div className="flex items-center justify-end">
      <p
        className="font-ui text-[0.48rem] uppercase tracking-[0.08em] text-zinc-400"
        aria-live="polite"
        aria-atomic="true"
      >
        Live updates: {label}
      </p>
    </div>
  );
}
