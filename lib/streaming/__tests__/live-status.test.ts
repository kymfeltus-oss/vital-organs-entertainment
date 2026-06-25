import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isMidBroadcastLiveStatus,
  normalizeStreamingLiveStatus,
  shouldStopStreamingLiveStatus,
} from "@/lib/streaming/live-status";

test("normalizeStreamingLiveStatus maps legacy values", () => {
  assert.equal(normalizeStreamingLiveStatus("connecting"), "preparing");
  assert.equal(normalizeStreamingLiveStatus("preparing_broadcast"), "preparing");
  assert.equal(normalizeStreamingLiveStatus("going_live"), "preparing");
  assert.equal(normalizeStreamingLiveStatus("connected"), "ready");
});

test("normalizeStreamingLiveStatus keeps approved values", () => {
  assert.equal(normalizeStreamingLiveStatus("validating"), "validating");
  assert.equal(normalizeStreamingLiveStatus("ready"), "ready");
  assert.equal(normalizeStreamingLiveStatus("offline"), "offline");
});

test("normalizeStreamingLiveStatus falls back to offline", () => {
  assert.equal(normalizeStreamingLiveStatus("unknown"), "offline");
  assert.equal(normalizeStreamingLiveStatus(null), "offline");
});

test("broadcast helpers use approved enum only", () => {
  assert.equal(isMidBroadcastLiveStatus("live"), true);
  assert.equal(isMidBroadcastLiveStatus("preparing"), true);
  assert.equal(isMidBroadcastLiveStatus("ready"), false);
  assert.equal(shouldStopStreamingLiveStatus("stopping"), true);
  assert.equal(shouldStopStreamingLiveStatus("ready"), false);
});
