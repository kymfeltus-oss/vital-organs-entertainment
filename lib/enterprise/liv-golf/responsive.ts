import {
  DEVICE_FIT_PAGE,
  DEVICE_FIT_SCROLL,
  DEVICE_FIT_VIEWPORT,
} from "@/lib/responsive";

/** Full-viewport immersive shell — live fan viewer */
export const LIV_VIEWER_SHELL = DEVICE_FIT_VIEWPORT;

/** Scrollable ops / executive page root */
export const LIV_OPS_PAGE = [
  DEVICE_FIT_PAGE,
  "bg-[#111111] font-sans text-white antialiased selection:bg-[#CCFF00] selection:text-black",
  "px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]",
  "sm:px-6 lg:px-8 xl:p-8",
].join(" ");

/** Constrained content rail for studio, stream setup, command center */
export const LIV_OPS_CONTENT = "mx-auto w-full max-w-6xl min-w-0";

/** Scrollable main column inside fixed-height viewer shells */
export const LIV_VIEWER_SCROLL = DEVICE_FIT_SCROLL;

/** Safe-area offsets for floating viewer chrome */
export const LIV_VIEWER_OVERLAY_INSET =
  "bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))]";

/** Module nav safe bottom padding */
export const LIV_MODULE_NAV_SAFE =
  "pb-[max(0px,env(safe-area-inset-bottom))]";
