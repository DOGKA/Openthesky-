import { norm360 } from "./kepler";

export const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export function zodiacSign(eclLon: number): ZodiacSign {
  return ZODIAC_SIGNS[Math.floor(norm360(eclLon) / 30) % 12];
}
