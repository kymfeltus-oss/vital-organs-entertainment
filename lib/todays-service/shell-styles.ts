import { PARABLE_SHELL } from "@/lib/broadcast/parable-tokens";

/** Layout class tokens shared by server shell and client islands — no React client boundary. */
export const TODAYS_SERVICE_SHELL = {
  page: PARABLE_SHELL.page,
  sidebar:
    "flex w-[220px] shrink-0 flex-col border-r border-white/10 bg-black",
  sidebarActive: "border-l-2 border-l-[#53fc18] bg-[#53fc18]/12 text-white",
  sidebarLink:
    "flex items-center gap-2.5 px-4 py-2.5 font-ui text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 transition hover:bg-white/5 hover:text-white",
  main: "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto",
  content: "flex flex-col gap-4 p-4 pb-28 lg:p-5",
  headerRow:
    "flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between",
} as const;
