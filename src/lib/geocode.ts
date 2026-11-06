import { fetchJson } from "@/lib/http";

interface GeocodeResponse {
  results?: { name: string; country?: string; latitude: number; longitude: number }[];
}

export async function findPlace(query: string): Promise<{ city: string; latitude: number; longitude: number } | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const data = await fetchJson<GeocodeResponse>(url.toString());
  const place = data.results?.[0];
  if (!place) {
    return null;
  }
  return {
    city: place.country ? `${place.name}, ${place.country}` : place.name,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}
