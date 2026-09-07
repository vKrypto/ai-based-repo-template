import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AddressForm } from "./AddressForm.js";
import type { ShippingAddressInput } from "../lib/orderTypes.js";

function buildAddress(overrides: Partial<ShippingAddressInput> = {}): ShippingAddressInput {
  return {
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
    ...overrides
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "geolocation");
});

describe("AddressForm", () => {
  it("renders all address fields with the given values", () => {
    const address = buildAddress({ name: "Ada Lovelace", city: "London" });
    render(<AddressForm value={address} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/full name/i)).toHaveValue("Ada Lovelace");
    expect(screen.getByLabelText(/^city$/i)).toHaveValue("London");
  });

  it("calls onChange with the updated field when a field is edited", () => {
    const onChange = vi.fn();
    render(<AddressForm value={buildAddress()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ada Lovelace" } });

    expect(onChange).toHaveBeenCalledWith(buildAddress({ name: "Ada Lovelace" }));
  });

  it("fills in the address from geolocation and reverse geocoding when 'Use My Location' is clicked", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 37.4224, longitude: -122.0842 }
      } as GeolocationPosition);
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition },
      configurable: true
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            line1: "1600 Amphitheatre Parkway",
            city: "Mountain View",
            state: "California",
            postalCode: "94043",
            country: "United States"
          })
      })
    );

    const onChange = vi.fn();
    render(<AddressForm value={buildAddress({ name: "Ada Lovelace" })} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        buildAddress({
          name: "Ada Lovelace",
          line1: "1600 Amphitheatre Parkway",
          city: "Mountain View",
          state: "California",
          postalCode: "94043",
          country: "United States"
        })
      );
    });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("/api/geocode/reverse?lat=37.4224&lng=-122.0842")
    );
  });

  it("shows an error message when geolocation is unsupported", async () => {
    render(<AddressForm value={buildAddress()} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));

    expect(await screen.findByText(/location is not supported/i)).toBeInTheDocument();
  });

  it("shows an error message when the user denies the geolocation permission", async () => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: "User denied Geolocation" } as GeolocationPositionError);
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition },
      configurable: true
    });

    render(<AddressForm value={buildAddress()} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));

    expect(await screen.findByText(/couldn.t access your location/i)).toBeInTheDocument();
  });
});
