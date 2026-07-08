"use client";

import { useCallback, useRef } from "react";

type LiturgicalColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - chroma / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [chroma, x, 0];
  else if (h < 120) [r, g, b] = [x, chroma, 0];
  else if (h < 180) [r, g, b] = [0, chroma, x];
  else if (h < 240) [r, g, b] = [0, x, chroma];
  else if (h < 300) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export default function LiturgicalColorPicker({
  value,
  onChange,
  label = "Liturgical Color Accent",
}: LiturgicalColorPickerProps) {
  const wheelRef = useRef<HTMLDivElement>(null);

  const pickFromWheel = useCallback(
    (clientX: number, clientY: number) => {
      const node = wheelRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const radius = rect.width / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > radius) return;

      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const hue = (angle + 360) % 360;
      const saturation = clamp((distance / radius) * 100, 35, 100);
      onChange(hslToHex(hue, saturation, 52));
    },
    [onChange],
  );

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
        {label}
      </label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 font-mono text-xs text-white focus:border-[#FFB800] focus:outline-none sm:max-w-[180px]"
          spellCheck={false}
        />
        <div
          ref={wheelRef}
          role="slider"
          aria-label={label}
          aria-valuetext={value}
          tabIndex={0}
          className="relative size-28 shrink-0 cursor-crosshair rounded-full border border-neutral-800 shadow-inner"
          style={{
            background:
              "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          }}
          onMouseDown={(event) => {
            pickFromWheel(event.clientX, event.clientY);
            const move = (moveEvent: MouseEvent) =>
              pickFromWheel(moveEvent.clientX, moveEvent.clientY);
            const up = () => {
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              onChange("#FFB800");
            }
          }}
        >
          <div className="absolute inset-4 rounded-full bg-[#0b0b0b]/35" />
          <div
            className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>
    </div>
  );
}
