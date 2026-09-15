import type { Locale } from "@/i18n";
import type { FrameBody, FrameConstellation } from "@/sky/frame";

export function constellationName(c: FrameConstellation, locale: Locale): string {
  return c.names[locale] || c.names.en;
}

export function bodyName(b: FrameBody, locale: Locale): string {
  return b.names[locale] || b.names.en;
}

const ZODIAC_NAMES: Record<Locale, Record<string, string>> = {
  en: {},
  tr: {
    Aries: "Koç",
    Taurus: "Boğa",
    Gemini: "İkizler",
    Cancer: "Yengeç",
    Leo: "Aslan",
    Virgo: "Başak",
    Libra: "Terazi",
    Scorpio: "Akrep",
    Sagittarius: "Yay",
    Capricorn: "Oğlak",
    Aquarius: "Kova",
    Pisces: "Balık",
  },
  de: {
    Aries: "Widder",
    Taurus: "Stier",
    Gemini: "Zwillinge",
    Cancer: "Krebs",
    Leo: "Löwe",
    Virgo: "Jungfrau",
    Libra: "Waage",
    Scorpio: "Skorpion",
    Sagittarius: "Schütze",
    Capricorn: "Steinbock",
    Aquarius: "Wassermann",
    Pisces: "Fische",
  },
  es: {
    Aries: "Aries",
    Taurus: "Tauro",
    Gemini: "Géminis",
    Cancer: "Cáncer",
    Leo: "Leo",
    Virgo: "Virgo",
    Libra: "Libra",
    Scorpio: "Escorpio",
    Sagittarius: "Sagitario",
    Capricorn: "Capricornio",
    Aquarius: "Acuario",
    Pisces: "Piscis",
  },
};

export function zodiacName(sign: string, locale: Locale): string {
  return ZODIAC_NAMES[locale]?.[sign] ?? sign;
}
