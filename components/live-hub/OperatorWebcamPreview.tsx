"use client";

import { Camera, CameraOff, Loader2 } from "lucide-react";
import { useOperatorWebcamPreview } from "@/hooks/useOperatorWebcamPreview";

export default function OperatorWebcamPreview() {
  const {
    videoRef,
    status,
    errorMessage,
    isActive,
    startPreview,
    stopPreview,
  } = useOperatorWebcamPreview();

  return (
    <section className="rounded-2xl border border-brand-border bg-brand-panel p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.2em] text-brand-blue">
            Local Camera Check
          </p>
          <p className="mt-1 font-body text-xs text-brand-muted">
            Operator-only hardware monitor. Does not stream to attendees — HLS path unchanged.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {!isActive ? (
            <button
              type="button"
              onClick={() => void startPreview()}
              disabled={status === "starting"}
              className="touch-target inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-blue/40 bg-brand-blue/10 px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white transition hover:border-brand-blue/60 disabled:opacity-60"
            >
              {status === "starting" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-brand-blue" aria-hidden="true" />
              )}
              Start Camera Check
            </button>
          ) : (
            <button
              type="button"
              onClick={stopPreview}
              className="touch-target inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-border px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-muted transition hover:border-brand-pink/40 hover:text-white"
            >
              <CameraOff className="h-3.5 w-3.5" aria-hidden="true" />
              Stop Camera Check
            </button>
          )}
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-xl border border-brand-border bg-brand-black ${
          isActive ? "aspect-video" : "hidden"
        }`}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          aria-label="Operator webcam preview"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {status === "error" && errorMessage ? (
        <p role="alert" className="mt-3 font-body text-xs text-brand-pink">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
