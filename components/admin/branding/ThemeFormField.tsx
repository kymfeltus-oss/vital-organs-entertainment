"use client";

import type { ReactNode } from "react";

type ThemeFormFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
};

export default function ThemeFormField({ label, htmlFor, hint, children }: ThemeFormFieldProps) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="theme-label mb-1.5 block">{label}</span>
      {children}
      {hint ? (
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
          {hint}
        </p>
      ) : null}
    </label>
  );
}
