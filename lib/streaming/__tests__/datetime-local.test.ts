import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toIsoFromLocalDateTimeInput, toLocalDateTimeInput } from "@/lib/streaming/datetime-local";

describe("streaming datetime-local helpers", () => {
  it("round-trips local wall time through ISO", () => {
    const local = "2026-06-25T10:00";
    const iso = toIsoFromLocalDateTimeInput(local);
    assert.ok(iso);
    assert.equal(toLocalDateTimeInput(iso), local);
  });

  it("returns empty string for missing input", () => {
    assert.equal(toLocalDateTimeInput(null), "");
    assert.equal(toLocalDateTimeInput(undefined), "");
    assert.equal(toLocalDateTimeInput(""), "");
  });

  it("returns null ISO for empty local input", () => {
    assert.equal(toIsoFromLocalDateTimeInput(""), null);
  });

  it("parses service default without timezone suffix as local", () => {
    assert.equal(toLocalDateTimeInput("2026-06-25T10:00:00"), "2026-06-25T10:00");
  });
});
