"use client";

type AwakeningHeaderProps = {
  displayName: string;
};

export default function AwakeningHeader({ displayName }: AwakeningHeaderProps) {
  return (
    <header className="relative mx-auto w-full max-w-[min(100%,24rem)] select-none overflow-hidden bg-transparent px-3 py-2 text-center sm:max-w-lg sm:py-4 md:max-w-3xl md:py-5">
      <div
        className="pointer-events-none absolute left-0 top-[40%] hidden h-[1.5px] w-[14%] max-w-[3.75rem] -translate-y-1/2 opacity-75 sm:block"
        style={{
          background: "linear-gradient(90deg, transparent, #5ea8ff, #ffffff)",
          boxShadow: "-8px 0 12px #5ea8ff, 0 0 6px #ffffff",
        }}
        aria-hidden
      />

      <h1
        className="font-headline m-0 max-w-full text-[clamp(1.5rem,6.2vw,3rem)] uppercase leading-[0.95] tracking-[0.06em] sm:text-[clamp(1.9rem,5vw,3.5rem)] sm:tracking-[0.08em] md:text-[clamp(2.5rem,3.8vw,4rem)]"
        style={{
          background: "linear-gradient(90deg, #ff5ccf 0%, #ff84d8 40%, #5ea8ff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter:
            "drop-shadow(0 0 8px rgba(255,0,140,0.5)) drop-shadow(0 0 14px rgba(0,168,255,0.4))",
        }}
      >
        Welcome {displayName}
      </h1>

      <p className="font-ui mx-auto mt-1.5 max-w-full text-[clamp(0.55rem,2.6vw,0.75rem)] font-semibold uppercase tracking-[0.26em] text-white opacity-90 sm:mt-2 sm:text-[0.7rem] sm:tracking-[0.36em] md:text-[0.8rem] md:tracking-[0.42em]">
        Tap Into The Awakening
      </p>

      <div
        className="pointer-events-none absolute right-0 top-[40%] hidden h-[1.5px] w-[14%] max-w-[3.75rem] -translate-y-1/2 opacity-75 sm:block"
        style={{
          background: "linear-gradient(90deg, #ffffff, #ff5ccf, transparent)",
          boxShadow: "8px 0 12px #ff5ccf, 0 0 6px #ffffff",
        }}
        aria-hidden
      />
    </header>
  );
}
