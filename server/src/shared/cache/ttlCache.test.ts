import { describe, it, expect, vi, afterEach } from "vitest";
import { TtlCache } from "./ttlCache.js";

describe("TtlCache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the stored value when read before the ttl expires", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  it("returns undefined when the key was never set", () => {
    const cache = new TtlCache<string>(1000);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("returns undefined once the ttl has elapsed", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1000);
    cache.set("key", "value");
    vi.advanceTimersByTime(1001);
    expect(cache.get("key")).toBeUndefined();
  });

  it("evicts the entry on read once expired, so a later set is a clean miss-then-hit", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1000);
    cache.set("key", "value");
    vi.advanceTimersByTime(1001);
    expect(cache.get("key")).toBeUndefined();
    cache.set("key", "fresh-value");
    expect(cache.get("key")).toBe("fresh-value");
  });
});
