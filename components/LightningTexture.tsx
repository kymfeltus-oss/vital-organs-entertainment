"use client";

type LightningTextureProps = {
  className?: string;
  intensity?: "subtle" | "hero";
};

export default function LightningTexture({
  className = "",
  intensity = "subtle",
}: LightningTextureProps) {
  const opacity = intensity === "hero" ? "opacity-[0.22]" : "opacity-[0.12]";

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${opacity} ${className}`}
      aria-hidden="true"
    >
      <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 220">
        <defs>
          <filter id="neon-cracks">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="8" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <linearGradient id="crack-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00B8FF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#6A00FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF008C" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" filter="url(#neon-cracks)" opacity="0.35" />
        <path
          d="M0 110 L80 95 L120 130 L180 80 L240 140 L300 90 L360 120 L400 105"
          fill="none"
          stroke="url(#crack-cyan)"
          strokeWidth="1.2"
          opacity="0.55"
        />
        <path
          d="M20 40 L90 70 L140 30 L200 85 L260 45 L320 75 L380 50"
          fill="none"
          stroke="#00B8FF"
          strokeWidth="0.8"
          opacity="0.35"
        />
        <path
          d="M10 180 L70 150 L130 190 L190 160 L250 200 L310 170 L390 185"
          fill="none"
          stroke="#FF008C"
          strokeWidth="0.8"
          opacity="0.35"
        />
        <path
          d="M60 0 L95 60 L75 120 L110 180 L85 220"
          fill="none"
          stroke="#6A00FF"
          strokeWidth="0.6"
          opacity="0.3"
        />
        <path
          d="M340 0 L305 55 L325 115 L290 175 L315 220"
          fill="none"
          stroke="#FF2BD6"
          strokeWidth="0.6"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}
