import { fetchReverseGeocode, type NominatimAddress } from "../../infra/geocoding/nominatimClient.js";
import { ValidationError } from "../../shared/errors/index.js";
import type { GeocodedAddressDTO } from "./geocode.types.js";

function buildLine1(address: NominatimAddress, displayName: string | undefined): string {
  const streetLine = [address.house_number, address.road].filter(Boolean).join(" ").trim();
  if (streetLine) {
    return streetLine;
  }
  return displayName?.split(",")[0]?.trim() ?? "";
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  fetchImpl: typeof fetch = fetch
): Promise<GeocodedAddressDTO> {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new ValidationError("lat must be a finite number between -90 and 90");
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new ValidationError("lng must be a finite number between -180 and 180");
  }

  const result = await fetchReverseGeocode(lat, lng, fetchImpl);
  const address = result.address ?? {};

  return {
    line1: buildLine1(address, result.display_name),
    city: address.city ?? address.town ?? address.village ?? "",
    state: address.state ?? "",
    postalCode: address.postcode ?? "",
    country: address.country ?? ""
  };
}
