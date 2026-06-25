import { PARABLE_SHELL } from "@/lib/broadcast/parable-tokens";

type SectionPlaceholderProps = {
  minHeight?: string;
};

/** Reserved height while a lazy section chunk loads — keeps CLS near zero. */
export default function SectionPlaceholder({ minHeight = "220px" }: SectionPlaceholderProps) {
  return (
    <div
      className={`${PARABLE_SHELL.panel} animate-pulse rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
      style={{ minHeight }}
      aria-hidden="true"
    />
  );
}
