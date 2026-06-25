/** Stable layout tokens for streaming UI — prevents CLS when async data arrives. */

export const STREAMING_SECTION_MIN_HEIGHT = "min-h-[280px]" as const;
export const STREAMING_ACCOUNTS_LABEL = "Streaming Accounts" as const;
export const STREAMING_SECTION_TITLE = "Where You're Streaming" as const;

/** Reserved slot for setup warning — content toggles visibility, height stays stable. */
export const STREAMING_WARNING_SLOT_CLASS = "min-h-[3.25rem]" as const;

/** Destination card body — fits status row, meta grid, action buttons. */
export const DESTINATION_CARD_MIN_HEIGHT = "min-h-[12.5rem]" as const;

/** Test result panel — loading + result share one slot. */
export const TEST_RESULT_SLOT_MIN_HEIGHT = "min-h-[5.5rem]" as const;

/** Error line under card meta. */
export const DESTINATION_ERROR_SLOT_CLASS = "min-h-[2.75rem]" as const;

/** Wizard modal scroll body — step swaps without height jump. */
export const WIZARD_BODY_MIN_HEIGHT = "min-h-[28rem]" as const;

/** Live status strip above dashboard sections. */
export const LIVE_STATUS_STRIP_CLASS = "min-h-[1.25rem]" as const;
