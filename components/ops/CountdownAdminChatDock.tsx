"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, MessageSquare, X } from "lucide-react";
import PublicCountdownChatMonitor from "@/components/countdown/PublicCountdownChatMonitor";
import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";

type CountdownAdminChatDockProps = {
  messages: FellowshipChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  troubleCount: number;
};

export default function CountdownAdminChatDock({
  messages,
  isLoading,
  isConnected,
  troubleCount,
}: CountdownAdminChatDockProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  const closePanel = useCallback(() => {
    setExpanded(false);
  }, []);

  return (
    <div
      className={`countdown-admin-chat-dock hidden lg:block${
        expanded ? " countdown-admin-chat-dock--expanded" : " countdown-admin-chat-dock--collapsed"
      }`}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={toggleExpanded}
          className="countdown-admin-chat-dock__tab touch-target font-ui"
          aria-expanded={false}
          aria-controls="countdown-admin-chat-panel"
        >
          <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="countdown-admin-chat-dock__tab-label">Live Chat</span>
          {troubleCount > 0 ? (
            <span className="countdown-admin-chat-dock__tab-badge" aria-label={`${troubleCount} alerts`}>
              {troubleCount}
            </span>
          ) : null}
          <ChevronLeft className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
        </button>
      ) : (
        <div
          id="countdown-admin-chat-panel"
          className="countdown-admin-chat-dock__panel"
          role="region"
          aria-label="Live chat monitor panel"
        >
          <div className="countdown-admin-chat-dock__panel-header">
            <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
              Live Chat Monitor
            </p>
            <button
              type="button"
              onClick={closePanel}
              className="countdown-admin-chat-dock__close touch-target rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-panel hover:text-white"
              aria-label="Collapse live chat monitor"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="countdown-admin-chat-dock__panel-body">
            <PublicCountdownChatMonitor
              messages={messages}
              isLoading={isLoading}
              isConnected={isConnected}
              layout="sidebar"
              placement="embedded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
