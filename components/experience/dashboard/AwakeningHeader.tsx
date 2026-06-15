"use client";

type AwakeningHeaderProps = {
  displayName: string;
};

const HEADER_GRADIENT =
  "linear-gradient(90deg, #ff5ccf 0%, #ff84d8 40%, #5ea8ff 100%)";

const HEADER_GLOW =
  "drop-shadow(0 0 8px rgba(255,0,140,0.5)) drop-shadow(0 0 14px rgba(0,168,255,0.4))";

export default function AwakeningHeader({ displayName }: AwakeningHeaderProps) {
  const welcomeLine = `Welcome ${displayName}`;

  return (
    <header className="relative mx-auto w-full max-w-[min(100%,24rem)] select-none bg-transparent px-3 py-2 text-center sm:max-w-lg sm:py-4 md:max-w-3xl md:py-5">
      <h1
        key={welcomeLine}
        className="font-headline relative m-0 max-w-full text-[clamp(1.5rem,6.2vw,3rem)] uppercase leading-[0.95] tracking-[0.06em] sm:text-[clamp(1.9rem,5vw,3.5rem)] sm:tracking-[0.08em] md:text-[clamp(2.5rem,3.8vw,4rem)]"
        style={{
          background: HEADER_GRADIENT,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: HEADER_GLOW,
        }}
      >
        {welcomeLine}
      </h1>

      <p className="font-ui mx-auto mt-1.5 max-w-full text-[clamp(0.55rem,2.6vw,0.75rem)] font-semibold uppercase tracking-[0.26em] text-white opacity-90 sm:mt-2 sm:text-[0.7rem] sm:tracking-[0.36em] md:text-[0.8rem] md:tracking-[0.42em]">
        Tap Into The Awakening
      </p>
    </header>
  );
}
