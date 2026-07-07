"use client";

export default function ParableLogo({ size = 80 }: { size?: number }) {
  return (
    <div
      className="flex select-none flex-col items-center justify-center"
      style={{ gap: `${size * 0.2}px` }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform transition-transform duration-700 hover:rotate-180"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="parable-flagship-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00C2FF" />
            <stop offset="50%" stopColor="#6C4DFF" />
            <stop offset="100%" stopColor="#FF0F8E" />
          </linearGradient>
        </defs>
        <path
          d="M25 40C25 28.9543 33.9543 20 45 20H55C66.0457 20 75 28.9543 75 40V60C75 71.0457 66.0457 80 55 80H45C33.9543 80 25 71.0457 25 60V40Z"
          stroke="url(#parable-flagship-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M40 35H60" stroke="#00C2FF" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
        <path d="M35 50H65" stroke="#6C4DFF" strokeWidth="4" strokeLinecap="round" />
        <path d="M40 65H60" stroke="#FF0F8E" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      </svg>

      <div className="text-center font-sans">
        <h1 className="ml-[0.4em] text-2xl font-light uppercase tracking-[0.4em] text-white transition-all duration-500 hover:tracking-[0.5em]">
          P<span className="inline-block scale-x-[1.15] font-extralight text-neutral-100">Λ</span>R
          <span className="inline-block scale-x-[1.15] font-extralight text-neutral-100">Λ</span>BLE
        </h1>
        <h2 className="ml-[0.6em] mt-1 text-[10px] font-medium uppercase tracking-[0.6em] text-neutral-500">
          STREAMING
        </h2>
      </div>
    </div>
  );
}
