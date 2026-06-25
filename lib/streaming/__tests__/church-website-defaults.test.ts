import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDefaultChurchWebsiteSettings,
  DEFAULT_CHURCH_STREAM_PAGE_URL,
  DEFAULT_CHURCH_WEBSITE_NAME,
  withChurchWebsiteDefaults,
} from "@/lib/streaming/church-website-shared";

describe("church website defaults", () => {
  it("uses Vital Organs production defaults", () => {
    const defaults = createDefaultChurchWebsiteSettings();
    assert.equal(defaults.websiteName, DEFAULT_CHURCH_WEBSITE_NAME);
    assert.equal(defaults.streamPageUrl, DEFAULT_CHURCH_STREAM_PAGE_URL);
    assert.equal(defaults.embedMethod, "iframe");
  });

  it("fills only empty fields when merging", () => {
    const merged = withChurchWebsiteDefaults({
      websiteName: "Custom Church",
      streamPageUrl: "",
      embedMethod: "link",
    });
    assert.equal(merged.websiteName, "Custom Church");
    assert.equal(merged.streamPageUrl, DEFAULT_CHURCH_STREAM_PAGE_URL);
    assert.equal(merged.embedMethod, "link");
  });
});
