"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Star } from "lucide-react";
import PlatformLogo from "@/components/streaming/PlatformLogo";
import { estimateCombinedSetupTime } from "@/lib/streaming/broadcast-catalog";
import type { StreamingPlatform } from "@/lib/streaming/types";
import type { BroadcastDestinationCard } from "@/lib/todays-service/types";

const PARABLE_GREEN = "#53fc18";

type BroadcastDestinationChooserProps = {
  cards?: BroadcastDestinationCard[];
  initialSelected?: StreamingPlatform[];
  busy?: boolean;
  onContinue: (platforms: StreamingPlatform[]) => Promise<void>;
};

function formatLastConnected(at: string | null): string {
  if (!at) return "Never";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(at));
  } catch {
    return "Unknown";
  }
}

export default function BroadcastDestinationChooser({
  cards: cardsProp,
  initialSelected,
  busy = false,
  onContinue,
}: BroadcastDestinationChooserProps) {
  const cards = cardsProp ?? [];

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7242/ingest/90113a7b-b2ce-449d-9c16-dbf632e3c139", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
      body: JSON.stringify({
        sessionId: "675ed0",
        runId: "streaming-fix",
        hypothesisId: "H1-cards-undefined",
        location: "BroadcastDestinationChooser.tsx:render",
        message: "chooser cards",
        data: {
          propType: cardsProp == null ? "nullish" : "array",
          safeLength: cards.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => undefined);
  }, [cards.length, cardsProp]);
  // #endregion

  const visibleCards = useMemo(() => cards.filter((c) => c.platform !== "custom_rtmp" || true), [cards]);
  const defaultSelected = useMemo(
    () => initialSelected ?? cards.filter((c) => c.selected).map((c) => c.platform),
    [cards, initialSelected],
  );
  const [selected, setSelected] = useState<StreamingPlatform[]>(defaultSelected);
  const [focusIndex, setFocusIndex] = useState(0);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setSelected(defaultSelected);
  }, [defaultSelected]);

  const toggle = useCallback((platform: StreamingPlatform) => {
    setSelected((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  }, []);

  const selectedLabels = useMemo(
    () =>
      selected
        .map((p) => cards.find((c) => c.platform === p)?.label ?? p)
        .filter(Boolean),
    [selected, cards],
  );

  const setupEstimate = estimateCombinedSetupTime(selected);

  const onKeyDownCard = (event: React.KeyboardEvent, index: number, platform: StreamingPlatform) => {
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      toggle(platform);
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.min(visibleCards.length - 1, index + 1);
      setFocusIndex(next);
      cardRefs.current[next]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const prev = Math.max(0, index - 1);
      setFocusIndex(prev);
      cardRefs.current[prev]?.focus();
      return;
    }
    if (event.key === "Enter" && selected.length > 0) {
      event.preventDefault();
      void onContinue(selected);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-headline text-lg uppercase tracking-[0.1em] text-white">
          Choose Your Broadcast Destinations
        </h3>
        <p className="mt-2 font-body text-sm text-white/65">
          Select one or more places where today&apos;s service will be broadcast. You can add additional destinations at
          any time.
        </p>
      </div>

      <div
        role="listbox"
        aria-label="Broadcast destinations"
        aria-multiselectable="true"
        className="grid gap-3 md:grid-cols-2"
      >
        {visibleCards.map((card, index) => {
          const isSelected = selected.includes(card.platform);
          const isConnected =
            card.connectionStatus === "connected" || card.connectionStatus === "ready";
          return (
            <button
              key={card.platform}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={`${card.label}. ${isConnected ? "Connected" : "Not connected"}. ${isSelected ? "Selected" : "Not selected"}`}
              tabIndex={index === focusIndex ? 0 : -1}
              disabled={busy}
              onKeyDown={(e) => onKeyDownCard(e, index, card.platform)}
              onClick={() => toggle(card.platform)}
              className={`group relative rounded-xl border p-4 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                isSelected
                  ? "border-[#53fc18]/70 bg-[#53fc18]/10 shadow-[0_0_24px_rgba(83,252,24,0.12)]"
                  : "border-white/10 bg-black/40 hover:border-white/25 hover:bg-black/55"
              }`}
              style={isSelected ? { borderColor: `${PARABLE_GREEN}aa` } : undefined}
            >
              {isSelected ? (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#53fc18] text-black">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
              ) : null}

              {card.recommended ? (
                <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-brand-blue/40 bg-brand-blue/10 px-2 py-0.5 font-ui text-[0.5rem] font-bold uppercase tracking-wider text-brand-blue">
                  <Star className="h-3 w-3" aria-hidden /> Recommended
                </span>
              ) : null}

              <div className="flex items-start gap-3">
                <PlatformLogo platform={card.platform} />
                <div className="min-w-0 flex-1 pr-8">
                  <p className="font-body text-sm font-semibold text-white">{card.label}</p>
                  <p className="mt-0.5 font-ui text-[0.5rem] uppercase tracking-wider text-white/45">
                    Setup {card.setupTimeLabel}
                  </p>

                  <div className="mt-3 space-y-1">
                    {isConnected ? (
                      <>
                        <p className="flex items-center gap-1.5 font-body text-xs text-[#53fc18]">
                          <Check className="h-3.5 w-3.5" aria-hidden /> Connected
                        </p>
                        {card.connectedAccount ? (
                          <p className="font-body text-xs text-white/75">{card.connectedAccount}</p>
                        ) : null}
                        <p className="font-body text-xs text-white/50">
                          Last Connected: {formatLastConnected(card.lastConnectedAt)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-body text-xs font-semibold text-white/70">Not Connected</p>
                        <p className="font-body text-xs text-white/50">Authentication Required</p>
                      </>
                    )}
                  </div>

                  <div className="mt-3 font-body text-xs text-white/55">
                    <p>
                      Max: {card.maxResolution} · {card.maxFps} FPS
                    </p>
                    <p className="mt-1">Supports:</p>
                    <ul className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                      {card.features.map((f) => (
                        <li key={f.id} className="text-white/70">
                          ✓ {f.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isConnected ? (
                    <div className="mt-3 rounded-md border border-white/8 bg-black/30 px-2 py-1.5">
                      <p
                        className={`font-ui text-[0.5rem] font-bold uppercase tracking-wider ${
                          card.health.status === "healthy" ? "text-[#53fc18]" : "text-amber-200"
                        }`}
                      >
                        {card.health.headline}
                      </p>
                      {card.health.details.map((line) => (
                        <p key={line} className="font-body text-[0.68rem] text-white/55">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/50 p-4">
        <p className="font-ui text-[0.55rem] uppercase tracking-[0.14em] text-white/45">Selected Destinations</p>
        {selectedLabels.length > 0 ? (
          <ul className="mt-2 space-y-1 font-body text-sm text-white">
            {selectedLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 font-body text-sm text-white/50">None selected yet.</p>
        )}
        <p className="mt-3 font-body text-sm text-white/65">
          Estimated Setup Time: <span className="text-white">{setupEstimate}</span>
        </p>
        <button
          type="button"
          disabled={busy || selected.length === 0}
          onClick={() => void onContinue(selected)}
          className="mt-4 w-full rounded-lg bg-brand-blue px-4 py-3 font-ui text-sm font-semibold uppercase tracking-wider text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
        >
          {busy ? "Saving…" : "Continue to Authentication →"}
        </button>
      </div>
    </div>
  );
}
