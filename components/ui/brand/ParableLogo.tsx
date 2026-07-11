import Image from "next/image";
import { FAITH_BRAND_FULL_NAME } from "@/lib/theme/faith-brand-guidelines";

const FLAGSHIP_LOGO_SRC = "/tenant-default/dashboard/logo.png";

export default function ParableLogo({ size = 80 }: { size?: number }) {
  return (
    <div className="mx-auto flex w-full select-none flex-col items-center justify-center px-8 py-6 sm:px-10 sm:py-8">
      <div
        className="relative flex items-center justify-center transition-transform duration-700 hover:scale-[1.03]"
        style={{
          width: size,
          height: size,
          marginBottom: `${size * 0.22}px`,
        }}
      >
        <Image
          src={FLAGSHIP_LOGO_SRC}
          alt={FAITH_BRAND_FULL_NAME}
          width={size}
          height={size}
          priority
          className="h-full w-full object-contain"
          sizes={`(max-width: 768px) ${Math.round(size * 0.9)}px, ${size}px`}
        />
      </div>

      <div className="text-center font-sans">
        <h1 className="ml-[0.4em] text-2xl font-light uppercase tracking-[0.4em] text-white transition-all duration-500 hover:tracking-[0.5em] sm:text-3xl">
          P<span className="inline-block scale-x-[1.15] font-extralight text-neutral-100">Λ</span>R
          <span className="inline-block scale-x-[1.15] font-extralight text-neutral-100">Λ</span>BLE
        </h1>
        <h2 className="ml-[0.6em] mt-1 text-[10px] font-semibold uppercase tracking-[0.55em] text-[#F5B400] sm:text-[11px]">
          FAITH OS
        </h2>
      </div>
    </div>
  );
}
