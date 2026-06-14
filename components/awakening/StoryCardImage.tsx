"use client";

import { useState } from "react";
import Image from "next/image";
import { AWAKENING_ASSETS } from "@/components/awakening/constants";

type StoryCardImageProps = {
  alt: string;
  className?: string;
  sizes?: string;
};

export default function StoryCardImage({
  alt,
  className = "object-cover object-center",
  sizes = "(max-width: 1024px) 100vw, 540px",
}: StoryCardImageProps) {
  const [src, setSrc] = useState(AWAKENING_ASSETS.story.primary);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => {
        if (src !== AWAKENING_ASSETS.story.fallback) {
          setSrc(AWAKENING_ASSETS.story.fallback);
        }
      }}
    />
  );
}
