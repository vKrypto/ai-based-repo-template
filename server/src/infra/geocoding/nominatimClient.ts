export interface NominatimAddress {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface NominatimReverseResponse {
  address?: NominatimAddress;
  display_name?: string;
}

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "BareBrilliant/1.0 (demo storefront; contact: support@barebrilliant.example)";

export async function fetchReverseGeocode(
  lat: number,
  lng: number,
  fetchImpl: typeof fetch = fetch
): Promise<NominatimReverseResponse> {
  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("addressdetails", "1");

  const response = await fetchImpl(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`reverse geocode request failed with status ${response.status}`);
  }

  return (await response.json()) as NominatimReverseResponse;
}
