"use client";

import { chatAuthorColorClass } from "@/lib/experience/chat-author-color";
import { IG_LIVE_MOCK_CHAT } from "@/lib/experience/ig-live-mock";

export default function IgLivePreviewSidebar() {
  return (
    <aside className="ig-live-glass-sidebar flex min-h-0 min-w-0 flex-col border-l border-brand-border">
      <div className="shrink-0 border-b border-brand-border px-4 py-3">
        <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
          Fellowship Chat
        </p>
        <p className="mt-1 font-body text-xs text-brand-muted">Preview mock messages</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {IG_LIVE_MOCK_CHAT.map((line) => (
          <p key={line.id} className="font-body text-sm leading-snug">
            <span className={`font-ui text-xs font-bold ${chatAuthorColorClass(line.userId)}`}>
              {line.author}
            </span>
            <span className="text-brand-muted"> · </span>
            <span className="text-white">{line.body}</span>
          </p>
        ))}
      </div>
    </aside>
  );
}
