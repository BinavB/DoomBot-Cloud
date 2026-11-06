import { currentTimeZone } from "@/lib/auth/context";
import { config } from "@/lib/config";
import { fetchJson } from "@/lib/http";
import { getHomeLocation } from "@/lib/settings";

interface ForecastResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

const weatherLabels: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "freezing fog",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  80: "rain showers",
  81: "rain showers",
  82: "violent rain showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "thunderstorm with heavy hail",
};

export async function fetchWeatherLine(): Promise<string> {
  const home = await getHomeLocation();
  const location = home ?? { city: config.cityName, latitude: config.latitude, longitude: config.longitude };
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("timezone", currentTimeZone());
  url.searchParams.set("forecast_days", "1");

  const forecast = await fetchJson<ForecastResponse>(url.toString());
  const label = weatherLabels[forecast.current.weather_code] ?? "mixed conditions";
  const high = Math.round(forecast.daily.temperature_2m_max[0]);
  const low = Math.round(forecast.daily.temperature_2m_min[0]);
  const rain = forecast.daily.precipitation_probability_max[0];

  return [
    `Weather in ${location.city}: ${label}, now ${Math.round(forecast.current.temperature_2m)}°C`,
    `(feels like ${Math.round(forecast.current.apparent_temperature)}°C), humidity ${forecast.current.relative_humidity_2m}%, wind ${Math.round(forecast.current.wind_speed_10m)} km/h.`,
    `Today: high ${high}°C, low ${low}°C, chance of rain up to ${rain}%.`,
  ].join(" ");
}
