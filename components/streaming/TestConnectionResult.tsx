"use client";

import { displayValidationChecks } from "@/lib/streaming/validation";
import type { StreamingTestResult } from "@/lib/streaming/types";

type TestConnectionResultProps = {
  running: boolean;
  result: StreamingTestResult | null;
};

export default function TestConnectionResult({ running, result }: TestConnectionResultProps) {
  if (running) {
    return (
      <div className="mt-3 rounded-lg border border-brand-blue/20 bg-brand-blue/5 p-3">
        <p className="font-body text-sm text-brand-blue">Testing destination…</p>
        <ul className="mt-2 space-y-1 font-body text-xs text-white/60">
          {displayValidationChecks([]).map((step) => (
            <li key={step.key}>○ {step.label}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (!result) return null;

  const checks = result.validation?.checks?.length
    ? displayValidationChecks(result.validation.checks)
    : result.steps;

  return (
    <div className={`mt-3 rounded-lg border p-3 ${result.success ? "border-[#53fc18]/30 bg-[#53fc18]/5" : "border-amber-500/30 bg-amber-950/20"}`}>
      <p className={`font-body text-sm ${result.success ? "text-[#53fc18]" : "text-amber-200"}`}>{result.message}</p>
      {checks.length > 0 ? (
        <ul className="mt-2 space-y-1 font-body text-xs text-white/70">
          {checks.map((step) => (
            <li key={step.key ?? step.label}>
              <span className={step.ok ? "text-[#53fc18]" : "text-amber-200"}>{step.ok ? "✓" : "○"}</span>{" "}
              {step.label}
              {!step.ok && step.message ? <span className="block pl-4 text-white/55">{step.message}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
