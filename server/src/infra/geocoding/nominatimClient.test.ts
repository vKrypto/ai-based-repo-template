import { describe, it, expect, vi } from "vitest";
import { fetchReverseGeocode } from "./nominatimClient.js";

function buildFakeFetch(body: unknown, ok = true, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body)
  }) as unknown as typeof fetch;
}

describe("fetchReverseGeocode", () => {
  it("requests Nominatim with the coordinates, format and a valid User-Agent", async () => {
    const fakeFetch = buildFakeFetch({ address: {}, display_name: "" });

    await fetchReverseGeocode(37.4224, -122.0842, fakeFetch);

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fakeFetch).mock.calls[0]!;
    expect(String(url)).toContain("nominatim.openstreetmap.org/reverse");
    expect(String(url)).toContain("lat=37.4224");
    expect(String(url)).toContain("lon=-122.0842");
    expect(String(url)).toContain("format=jsonv2");
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers["User-Agent"]).toMatch(/BareBrilliant/);
  });

  it("returns the parsed JSON body", async () => {
    const body = { address: { city: "Palo Alto" }, display_name: "123 Main St, Palo Alto" };
    const fakeFetch = buildFakeFetch(body);

    await expect(fetchReverseGeocode(1, 2, fakeFetch)).resolves.toEqual(body);
  });

  it("throws when the response is not ok", async () => {
    const fakeFetch = buildFakeFetch({}, false, 503);

    await expect(fetchReverseGeocode(1, 2, fakeFetch)).rejects.toThrow(/503/);
  });
});
