import type { City } from "./types";

export const CITIES: City[] = [
  { id: "ist", name: "İstanbul", country: "TR", latitude: 41.0082, longitude: 28.9784, tz: "Europe/Istanbul" },
  { id: "ank", name: "Ankara", country: "TR", latitude: 39.9334, longitude: 32.8597, tz: "Europe/Istanbul" },
  { id: "izm", name: "İzmir", country: "TR", latitude: 38.4237, longitude: 27.1428, tz: "Europe/Istanbul" },
  { id: "ant", name: "Antalya", country: "TR", latitude: 36.8969, longitude: 30.7133, tz: "Europe/Istanbul" },
  { id: "ber", name: "Berlin", country: "DE", latitude: 52.52, longitude: 13.405, tz: "Europe/Berlin" },
  { id: "mun", name: "München", country: "DE", latitude: 48.1351, longitude: 11.582, tz: "Europe/Berlin" },
  { id: "lon", name: "London", country: "GB", latitude: 51.5074, longitude: -0.1278, tz: "Europe/London" },
  { id: "par", name: "Paris", country: "FR", latitude: 48.8566, longitude: 2.3522, tz: "Europe/Paris" },
  { id: "mad", name: "Madrid", country: "ES", latitude: 40.4168, longitude: -3.7038, tz: "Europe/Madrid" },
  { id: "bcn", name: "Barcelona", country: "ES", latitude: 41.3874, longitude: 2.1686, tz: "Europe/Madrid" },
  { id: "nyc", name: "New York", country: "US", latitude: 40.7128, longitude: -74.006, tz: "America/New_York" },
  { id: "lax", name: "Los Angeles", country: "US", latitude: 34.0522, longitude: -118.2437, tz: "America/Los_Angeles" },
  { id: "mex", name: "Ciudad de México", country: "MX", latitude: 19.4326, longitude: -99.1332, tz: "America/Mexico_City" },
  { id: "bue", name: "Buenos Aires", country: "AR", latitude: -34.6037, longitude: -58.3816, tz: "America/Argentina/Buenos_Aires" },
  { id: "tok", name: "Tokyo", country: "JP", latitude: 35.6762, longitude: 139.6503, tz: "Asia/Tokyo" },
  { id: "syd", name: "Sydney", country: "AU", latitude: -33.8688, longitude: 151.2093, tz: "Australia/Sydney" },
];

export function cityById(id: string): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}
