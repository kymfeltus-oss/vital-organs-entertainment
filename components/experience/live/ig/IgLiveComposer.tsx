"use client";

import Link from "next/link";
import {
  FormEvent,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useIgLiveChat } from "@/components/experience/live/ig/IgLiveChatContext";
import { FELLOWSHIP_MAX_CONTENT_LENGTH } from "@/lib/experience/fellowship-chat";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";

export type IgLiveComposerHandle = {
  focus: () => void;
};

type IgLiveComposerProps = {
  onOpenGive: () => void;
};

const IgLiveComposer = forwardRef<IgLiveComposerHandle, IgLiveComposerProps>(
  function IgLiveComposer({ onOpenGive }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [draft, setDraft] = useState("");
    const { session, isSending, sendMessage } = useIgLiveChat();

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const canCompose = session.authenticated && session.canSend;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = draft.trim();
      if (!trimmed || isSending || !canCompose) return;

      void sendMessage(trimmed).then((sent) => {
        if (sent) setDraft("");
      });
    };

    return (
      <footer className="ig-live-composer absolute inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        {!session.authenticated ? (
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 font-body text-sm text-white/70 ig-live-text-shadow">
              Sign in to comment
            </p>
            <Link
              href={buildAttendeeGateUrl(EXPERIENCE_LIVE_PATH)}
              className="touch-target shrink-0 rounded-full border border-brand-blue/40 bg-brand-blue/10 px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-blue"
            >
              Sign In
            </Link>
          </div>
        ) : !session.canSend ? (
          <p className="font-body text-sm text-brand-muted ig-live-text-shadow">
            You are muted in Fellowship Chat.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <label className="sr-only" htmlFor="ig-live-comment">
              Add a comment
            </label>
            <input
              ref={inputRef}
              id="ig-live-comment"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a comment..."
              disabled={isSending}
              maxLength={FELLOWSHIP_MAX_CONTENT_LENGTH}
              className="h-12 min-w-0 flex-1 rounded-full border-0 bg-black/50 px-5 font-body text-sm text-white placeholder:text-white/50 backdrop-blur-md ig-live-text-shadow focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
            <button
              type="button"
              onClick={onOpenGive}
              className="ig-live-seed-glow touch-target flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 text-lg shadow-[0_0_24px_rgba(250,204,21,0.35)]"
              aria-label="Give seeds"
            >
              🌱
            </button>
          </form>
        )}
      </footer>
    );
  },
);

export default IgLiveComposer;
