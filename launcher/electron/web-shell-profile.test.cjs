const assert = require("node:assert");
const { describe, it } = require("node:test");

const {
  MAX_SEGMENT_LENGTH,
  sanitizeSegment,
  resolveWebShellPartition,
} = require("./web-shell-profile.cjs");

describe("sanitizeSegment", () => {
  it("passes through simple ids", () => {
    assert.strictEqual(sanitizeSegment("netflix"), "netflix");
  });

  it("replaces filesystem-invalid characters with underscores", () => {
    assert.strictEqual(sanitizeSegment("primevideo/beta"), "primevideo_beta");
    assert.strictEqual(sanitizeSegment("a:b*c?d"), "a_b_c_d");
  });

  it("strips control characters", () => {
    assert.strictEqual(sanitizeSegment("net\u0001flix"), "net_flix");
  });

  it("trims and falls back to 'app' when input is empty after cleaning", () => {
    assert.strictEqual(sanitizeSegment("  "), "app");
    assert.strictEqual(sanitizeSegment(""), "app");
  });

  it("maps invalid chars to underscores 1:1 (parity with C# SanitizeSegment)", () => {
    // C# `SanitizeSegment` also returns "___" for "///"; it only falls back to the
    // default when the post-replace string is zero-length.
    assert.strictEqual(sanitizeSegment("///"), "___");
  });

  it("caps length at MAX_SEGMENT_LENGTH", () => {
    const long = "a".repeat(MAX_SEGMENT_LENGTH + 50);
    assert.strictEqual(sanitizeSegment(long).length, MAX_SEGMENT_LENGTH);
  });

  it("returns fallback when input is not a string", () => {
    assert.strictEqual(sanitizeSegment(undefined), "app");
    assert.strictEqual(sanitizeSegment(null), "app");
    assert.strictEqual(sanitizeSegment(42), "app");
  });
});

describe("resolveWebShellPartition", () => {
  it("uses chromeProfileSegment when set", () => {
    const r = resolveWebShellPartition({ appId: "netflix", chromeProfileSegment: "shared-streaming" });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.segment, "shared-streaming");
    assert.strictEqual(r.partition, "persist:shared-streaming");
  });

  it("falls back to appId when segment is empty", () => {
    const r = resolveWebShellPartition({ appId: "netflix", chromeProfileSegment: "   " });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.segment, "netflix");
    assert.strictEqual(r.partition, "persist:netflix");
  });

  it("uses appId when no segment provided", () => {
    const r = resolveWebShellPartition({ appId: "prime-video" });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.partition, "persist:prime-video");
  });

  it("two apps sharing a segment produce the same partition (shared sign-in)", () => {
    const a = resolveWebShellPartition({ appId: "netflix", chromeProfileSegment: "shared" });
    const b = resolveWebShellPartition({ appId: "disney-plus", chromeProfileSegment: "shared" });
    assert.strictEqual(a.ok && b.ok && a.partition, b.ok && b.partition);
  });

  it("fails when both appId and segment are missing", () => {
    const r = resolveWebShellPartition({});
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, "missing-segment");
  });

  it("fails on non-object input", () => {
    assert.strictEqual(resolveWebShellPartition(null).ok, false);
    assert.strictEqual(resolveWebShellPartition(undefined).ok, false);
    assert.strictEqual(resolveWebShellPartition("netflix").ok, false);
  });

  it("always prefixes partitions with persist: (persistent sessions only)", () => {
    const r = resolveWebShellPartition({ appId: "netflix" });
    assert.ok(r.ok);
    assert.ok(r.partition.startsWith("persist:"));
  });
});
