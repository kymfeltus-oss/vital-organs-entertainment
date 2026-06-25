import { PARABLE_SHELL } from "@/lib/broadcast/parable-tokens";
import {
  STREAMING_ACCOUNTS_LABEL,
  STREAMING_SECTION_MIN_HEIGHT,
  STREAMING_SECTION_TITLE,
} from "@/lib/streaming/streaming-layout";
import { TS } from "@/components/todays-service/ServiceUi";

/** Stable shell shown while StreamingSection chunk loads — title paints before hydration. */
export default function StreamingSectionFallback() {
  return (
    <section
      className={`${TS.panel} ${STREAMING_SECTION_MIN_HEIGHT} flex flex-col rounded-xl p-4`}
      aria-busy="true"
      aria-label="Loading streaming destinations"
    >
      <div className={TS.panelHeader}>
        <h2 className={TS.panelTitle}>{STREAMING_SECTION_TITLE}</h2>
      </div>
      <p className="font-ui text-[0.5rem] uppercase tracking-[0.12em] text-white/45">
        {STREAMING_ACCOUNTS_LABEL}
      </p>
      <div
        className={`${PARABLE_SHELL.panel} mt-3 flex-1 animate-pulse rounded-lg`}
        style={{ minHeight: "10rem" }}
        aria-hidden="true"
      />
    </section>
  );
}
