import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchJson, sendJson, ApiError } from "./apiClient.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("resolves with the parsed JSON body on a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ hello: "world" }) })
    );

    await expect(fetchJson("/api/example")).resolves.toEqual({ hello: "world" });
  });

  it("throws an ApiError carrying the response status on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) }));

    await expect(fetchJson("/api/example")).rejects.toBeInstanceOf(ApiError);
    try {
      await fetchJson("/api/example");
      expect.unreachable();
    } catch (error) {
      expect((error as ApiError).status).toBe(404);
    }
  });
});

describe("sendJson", () => {
  it("sends the method, JSON content-type header and stringified body", async () => {
    const fakeFetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ items: [] }) });
    vi.stubGlobal("fetch", fakeFetch);

    await sendJson("POST", "/api/cart/items", { itemId: "241257", quantity: 2 });

    expect(fakeFetch).toHaveBeenCalledWith(
      "/api/cart/items",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: "241257", quantity: 2 })
      })
    );
  });

  it("sends no body for a bodyless request", async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fakeFetch);

    await sendJson("DELETE", "/api/cart/items/241257");

    const [, options] = fakeFetch.mock.calls[0]!;
    expect(options.body).toBeUndefined();
  });

  it("resolves with the parsed JSON body on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) })
    );

    await expect(sendJson("PATCH", "/api/cart/items/241257", { quantity: 3 })).resolves.toEqual({ ok: true });
  });

  it("throws an ApiError on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({}) }));

    await expect(sendJson("POST", "/api/cart/items", {})).rejects.toBeInstanceOf(ApiError);
  });
});
