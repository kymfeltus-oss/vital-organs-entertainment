"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ORB_ITEMS } from "@/components/awakening/constants";

export default function OrbNavigation() {
  return (
    <nav
      className="mx-auto mt-10 flex w-full max-w-[920px] flex-wrap justify-center gap-x-[clamp(1.5rem,5vw,4.5rem)] gap-y-8"
      aria-label="Dashboard navigation orbs"
    >
      {ORB_ITEMS.map((orb) => (
        <Link
          key={orb.id}
          href={orb.href}
          className="group flex w-[160px] flex-col items-center text-center transition-transform hover:-translate-y-1"
        >
          <div
            className={`rounded-full p-[2px] transition-shadow duration-300 group-hover:scale-[1.03] ${orb.ringClass} ${orb.glow}`}
          >
            <div className="flex h-[156px] w-[156px] items-center justify-center rounded-full bg-[#020208]/55 p-3 backdrop-blur-sm">
              <OrbImage
                src={orb.image}
                fallback={"imageFallback" in orb ? orb.imageFallback : undefined}
                alt={orb.label}
              />
            </div>
          </div>
          <h3
            className="mt-3 font-ui text-[0.58rem] font-bold uppercase leading-snug tracking-[0.1em]"
            style={{ color: orb.labelColor }}
          >
            {orb.label}
          </h3>
          <p className="mt-1 font-ui text-[0.62rem] leading-relaxed text-white/60">{orb.description}</p>
        </Link>
      ))}
    </nav>
  );
}

function OrbImage({
  src,
  fallback,
  alt,
}: {
  src: string;
  fallback?: string;
  alt: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={130}
      height={130}
      className="h-[130px] w-[130px] object-contain"
      onError={() => {
        if (fallback && currentSrc !== fallback) {
          setCurrentSrc(fallback);
        }
      }}
    />
  );
}
