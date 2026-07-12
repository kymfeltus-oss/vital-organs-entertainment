"use client";

import React from "react";
import type { LiveMarket, Selection } from "./types";

interface ActiveMarketCardProps {
  market: LiveMarket;
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
}

const OddsChip = React.memo(
  ({
    selection,
    isSelected,
    onClick,
    disabled,
  }: {
    selection: Selection;
    isSelected: boolean;
    onClick: () => void;
    disabled: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border p-3 text-xs font-bold transition-all duration-200 ${
        isSelected
          ? "border-[#CCFF00] bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.2)]"
          : "border-neutral-800 bg-neutral-800/80 text-white hover:bg-neutral-800"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span className="tracking-wide">{selection.name}</span>
      <span className={`font-mono text-xs ${isSelected ? "text-black" : "text-[#CCFF00]"}`}>
        {selection.multiplier}x
      </span>
    </button>
  ),
);
OddsChip.displayName = "OddsChip";

export const ActiveMarketCard = React.memo(
  ({ market, selectedId, onSelect, disabled }: ActiveMarketCardProps) => (
    <div className="flex flex-1 flex-col justify-center py-2">
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-neutral-800 bg-black/20 p-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={market.player.image}
          alt={market.player.name}
          className="h-10 w-10 rounded-lg border border-neutral-700 bg-neutral-800 object-cover"
        />
        <div>
          <h4 className="text-sm font-bold tracking-tight text-white">{market.player.name}</h4>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${market.player.teamColor}22`,
              color: market.player.teamColor,
            }}
          >
            {market.player.team}
          </span>
        </div>
      </div>

      <p className="mb-4 min-h-[32px] text-xs font-medium leading-relaxed text-neutral-200">
        {market.question}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {market.selections.map((sel) => (
          <OddsChip
            key={sel.id}
            selection={sel}
            isSelected={selectedId === sel.id}
            onClick={() => onSelect(sel.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  ),
);

ActiveMarketCard.displayName = "ActiveMarketCard";
