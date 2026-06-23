export default function ParableIsolatedStackBanner() {
  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full border-b border-dashed border-brand-purple/50 bg-brand-purple/20 px-4 py-2.5 text-center text-sm font-medium text-white shadow-[0_0_20px_rgba(138,46,255,0.25)]"
    >
      <span className="font-ui uppercase tracking-[0.1em]">
        Rehearsal — Isolated Stack Active
      </span>
      <span className="mt-0.5 block text-xs font-normal normal-case tracking-normal text-brand-muted">
        Operations here run inside an in-memory adapter and do not update the main attendee
        platform live state.
      </span>
    </div>
  );
}
