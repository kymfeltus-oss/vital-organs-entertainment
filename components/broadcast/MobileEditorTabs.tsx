"use client";

export type MobileEditorTab = "editor" | "chat";

type MobileEditorTabsProps = {
  activeTab: MobileEditorTab;
  onTabChange: (tab: MobileEditorTab) => void;
};

export default function MobileEditorTabs({ activeTab, onTabChange }: MobileEditorTabsProps) {
  return (
    <div
      className="grid h-12 shrink-0 grid-cols-2 border-b border-brand-border bg-brand-panel"
      role="tablist"
      aria-label="Countdown admin workspaces"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "editor"}
        aria-label="Editor configuration"
        onClick={() => onTabChange("editor")}
        className={`touch-target font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] transition-colors ${
          activeTab === "editor"
            ? "border-b-2 border-brand-purple text-brand-purple"
            : "text-brand-muted"
        }`}
      >
        Editor
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "chat"}
        aria-label="Live chat tracking"
        onClick={() => onTabChange("chat")}
        className={`touch-target font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] transition-colors ${
          activeTab === "chat"
            ? "border-b-2 border-brand-purple text-brand-purple"
            : "text-brand-muted"
        }`}
      >
        Chat
      </button>
    </div>
  );
}
