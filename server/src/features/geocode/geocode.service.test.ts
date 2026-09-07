import { describe, it, expect, vi } from "vitest";
import { ValidationError } from "../../shared/errors/index.js";
import { reverseGeocode } from "./geocode.service.js";

function buildFakeFetch(body: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as typeof fetch;
}

describe("reverseGeocode", () => {
  it("normalizes a full Nominatim address into the flat DTO shape", async () => {
    const fakeFetch = buildFakeFetch({
      address: {
        house_number: "1600",
        road: "Amphitheatre Parkway",
        city: "Mountain View",
        state: "California",
        postcode: "94043",
        country: "United States"
      },
      display_name: "1600 Amphitheatre Parkway, Mountain View, California, 94043, United States"
    });

    const address = await reverseGeocode(37.422, -122.084, fakeFetch);

    expect(address).toEqual({
      line1: "1600 Amphitheatre Parkway",
      city: "Mountain View",
      state: "California",
      postalCode: "94043",
      country: "United States"
    });
  });

  it("falls back to town/village when city is absent", async () => {
    const fakeFetch = buildFakeFetch({ address: { town: "Springfield" }, display_name: "" });

    const address = await reverseGeocode(1, 2, fakeFetch);

    expect(address.city).toBe("Springfield");
  });

  it("falls back to the first display_name segment when there is no house number/road", async () => {
    const fakeFetch = buildFakeFetch({ address: {}, display_name: "Some Landmark, City, State" });

    const address = await reverseGeocode(1, 2, fakeFetch);

    expect(address.line1).toBe("Some Landmark");
  });

  it("rejects an out-of-range latitude", async () => {
    await expect(reverseGeocode(200, 0, buildFakeFetch({}))).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects an out-of-range longitude", async () => {
    await expect(reverseGeocode(0, -200, buildFakeFetch({}))).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a non-finite coordinate", async () => {
    await expect(reverseGeocode(Number.NaN, 0, buildFakeFetch({}))).rejects.toBeInstanceOf(ValidationError);
  });
});
