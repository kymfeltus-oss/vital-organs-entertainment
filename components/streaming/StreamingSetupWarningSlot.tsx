import { memo } from "react";
import { STREAMING_WARNING_SLOT_CLASS } from "@/lib/streaming/streaming-layout";

type StreamingSetupWarningSlotProps = {
  visible: boolean;
};

/** Fixed-height warning area — toggles copy without shifting the card grid. */
function StreamingSetupWarningSlot({ visible }: StreamingSetupWarningSlotProps) {
  return (
    <div className={STREAMING_WARNING_SLOT_CLASS} aria-live="polite">
      {visible ? (
        <p className="font-body text-sm text-amber-200/90">
          Choose at least one streaming destination and complete setup before going live.
        </p>
      ) : (
        <span className="sr-only">Streaming setup complete for today.</span>
      )}
    </div>
  );
}

export default memo(StreamingSetupWarningSlot);
