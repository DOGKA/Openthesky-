/**
 * Birth profiles for the prototype. In Astrolic these come from the user's
 * profile (`date_of_birth`, `time_of_birth`, `latitude`, `longitude`,
 * `timezone`) and from friendships; the shape below mirrors those fields.
 */
import { createContext, useContext } from "react";

export type City = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  /** IANA time zone */
  tz: string;
};

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

export type BirthProfile = {
  id: string;
  name: string;
  /** YYYY-MM-DD, local to the birth place */
  date: string;
  /** HH:mm, local to the birth place */
  time: string;
  cityId: string;
  isMe?: boolean;
};

/** Where and when: what the sky engine needs. */
export type Observer = {
  latitude: number;
  longitude: number;
  /** fixed instant, or null for "live now" */
  date: Date | null;
  /** short label for HUDs, e.g. "İstanbul · doğum anı" */
  label: string;
};

// ---- time zone conversion (no library) -------------------------------------------

/** UTC offset in minutes of `tz` at the given instant. */
function tzOffsetMinutes(tz: string, at: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(at);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return Math.round((asUtc - at.getTime()) / 60000);
  } catch {
    return 0;
  }
}

/** Convert a wall-clock date/time in `tz` to an absolute instant. */
export function zonedToDate(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm, 0);
  // two passes handle DST edges well enough for a birth time
  let guess = new Date(naive);
  for (let i = 0; i < 2; i++) {
    const off = tzOffsetMinutes(tz, guess);
    guess = new Date(naive - off * 60000);
  }
  return guess;
}

export function birthInstant(p: BirthProfile): Date {
  return zonedToDate(p.date, p.time, cityById(p.cityId).tz);
}

export function birthObserver(p: BirthProfile, label: string): Observer {
  const city = cityById(p.cityId);
  return {
    latitude: city.latitude,
    longitude: city.longitude,
    date: birthInstant(p),
    label,
  };
}

/** Next anniversary of the birth minute (same wall-clock time at the birth place). */
export function nextBirthdayInstant(p: BirthProfile, from: Date = new Date()): Date {
  const city = cityById(p.cityId);
  const [, m, d] = p.date.split("-").map(Number);
  for (let y = from.getFullYear(); y <= from.getFullYear() + 1; y++) {
    const candidate = zonedToDate(
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      p.time,
      city.tz
    );
    if (candidate.getTime() > from.getTime()) return candidate;
  }
  return from;
}

// ---- example data ------------------------------------------------------------------

export const EXAMPLE_PROFILES: BirthProfile[] = [
  { id: "me", name: "Sen", date: "1995-03-12", time: "04:20", cityId: "ist", isMe: true },
  // Friend from the Astrolic profile screenshot: Gemini sun, Capricorn rising, Libra moon.
  { id: "anil", name: "Anıl", date: "1997-06-08", time: "20:18", cityId: "ist" },
];

// ---- store ---------------------------------------------------------------------------

export type ProfilesStore = {
  profiles: BirthProfile[];
  me: BirthProfile;
  friends: BirthProfile[];
  byId: (id: string) => BirthProfile | undefined;
  upsert: (p: BirthProfile) => void;
  remove: (id: string) => void;
};

export const ProfilesContext = createContext<ProfilesStore | null>(null);

export function useProfiles(): ProfilesStore {
  const ctx = useContext(ProfilesContext);
  if (!ctx) throw new Error("useProfiles must be used inside ProfilesProvider");
  return ctx;
}
