import { WIZARD_BODY_MIN_HEIGHT } from "@/lib/streaming/streaming-layout";

export default function WizardStepPlaceholder() {
  return (
    <div
      className={`${WIZARD_BODY_MIN_HEIGHT} animate-pulse rounded-lg bg-white/5`}
      aria-hidden="true"
    />
  );
}
