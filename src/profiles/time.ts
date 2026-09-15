import type { BirthProfile, Observer } from "./types";
import { cityById } from "./cities";

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

export function zonedToDate(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm, 0);
  let guess = new Date(naive);
  for (let i = 0; i < 2; i++) {
    guess = new Date(naive - tzOffsetMinutes(tz, guess) * 60000);
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
