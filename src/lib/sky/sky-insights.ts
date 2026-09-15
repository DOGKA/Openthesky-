/**
 * Human-facing facts derived from a SkyFrame: the star overhead, what was
 * rising, the Moon's state, and a comparison of two skies.
 */
import type { SkyLocale } from "./sky-data";
import { angularDistance } from "./sky-render";
import { DEG2RAD, RAD2DEG } from "./sky-math";
import type { FrameBody, FrameConstellation, FrameStar, SkyFrame } from "./use-sky-frame";
import { zodiacSign } from "./sky-bodies";

export type StarFact = {
  star: FrameStar;
  /** display name: proper name, else designation, else "HIP-less" fallback */
  label: string;
  /** angular distance from the zenith in degrees */
  fromZenithDeg: number;
  constellationId: string | null;
};

/** Display label for a star. */
export function starLabel(s: FrameStar): string {
  return s.name || s.desig || `mag ${s.mag.toFixed(1)}`;
}

/** Constellation whose label centre is nearest to a direction. */
export function nearestConstellation(
  frame: SkyFrame,
  alt: number,
  az: number
): FrameConstellation | null {
  let best: FrameConstellation | null = null;
  let bestD = Infinity;
  for (const c of frame.constellations) {
    const d = angularDistance(c.center.alt, c.center.az, alt, az);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/**
 * "Your star": the brightest star near the zenith at that moment. Searches a
 * 12° cone first, widening if needed; prefers stars that have a name.
 */
export function zenithStar(frame: SkyFrame): StarFact | null {
  const zenith = Math.PI / 2;
  for (const coneDeg of [8, 12, 18, 25, 40]) {
    const cone = coneDeg * DEG2RAD;
    let best: FrameStar | null = null;
    let bestScore = Infinity;
    for (const s of frame.stars) {
      if (s.mag > 4.5) break;
      const d = zenith - s.alt; // distance from zenith is simply 90° − alt
      if (d > cone) continue;
      // brightness dominates, distance breaks ties, names get a bonus
      const score = s.mag + (d / cone) * 1.5 - (s.name ? 0.8 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }
    if (best) {
      return {
        star: best,
        label: starLabel(best),
        fromZenithDeg: (zenith - best.alt) * RAD2DEG,
        constellationId: nearestConstellation(frame, best.alt, best.az)?.id ?? null,
      };
    }
  }
  return null;
}

/**
 * Constellation rising in the east at that moment: the one whose centre is
 * nearest to a point a few degrees above the eastern horizon.
 */
export function risingConstellation(frame: SkyFrame): FrameConstellation | null {
  return nearestConstellation(frame, 8 * DEG2RAD, 90 * DEG2RAD);
}

/** Constellation setting in the west. */
export function settingConstellation(frame: SkyFrame): FrameConstellation | null {
  return nearestConstellation(frame, 8 * DEG2RAD, 270 * DEG2RAD);
}

/**
 * The star whose light left it when you were born: distance in light years
 * closest to the age in years. Prefers named stars; requires a distance.
 */
export function lightYearStar(frame: SkyFrame, ageYears: number): FrameStar | null {
  if (!(ageYears > 0)) return null;
  let best: FrameStar | null = null;
  let bestErr = Infinity;
  for (const s of frame.stars) {
    if (!s.ly || !s.name) continue;
    const err = Math.abs(s.ly - ageYears) / ageYears;
    if (err < bestErr) {
      bestErr = err;
      best = s;
    }
  }
  return best;
}

export function ageInYears(birth: Date, at: Date = new Date()): number {
  return (at.getTime() - birth.getTime()) / (365.25 * 86400000);
}

export type MoonFact = {
  body: FrameBody;
  illumination: number;
  /** waxing if elongation is increasing; derived from the Sun–Moon longitude difference */
  waxing: boolean;
  sign: ReturnType<typeof zodiacSign>;
  aboveHorizon: boolean;
};

export function moonFact(frame: SkyFrame): MoonFact | null {
  const moon = frame.bodies.find((b) => b.kind === "moon");
  const sun = frame.bodies.find((b) => b.kind === "sun");
  if (!moon || !sun) return null;
  const dLon = ((moon.eclLon - sun.eclLon) % 360 + 360) % 360;
  return {
    body: moon,
    illumination: moon.illumination ?? 0,
    waxing: dLon < 180,
    sign: zodiacSign(moon.eclLon),
    aboveHorizon: moon.alt > 0,
  };
}

/** Bodies above the horizon (Sun included so callers can tell day from night). */
export function bodiesAbove(frame: SkyFrame): FrameBody[] {
  return frame.bodies.filter((b) => b.alt > 0);
}

/** Constellations whose label centre is above the horizon. */
export function constellationsAbove(frame: SkyFrame): FrameConstellation[] {
  return frame.constellations.filter((c) => c.center.alt > 0);
}

export function isNight(frame: SkyFrame): boolean {
  const sun = frame.bodies.find((b) => b.kind === "sun");
  return !sun || sun.alt < -6 * DEG2RAD; // civil twilight
}

// ---- two skies ----------------------------------------------------------------

export type SkyComparison = {
  sharedConstellations: FrameConstellation[];
  onlyA: FrameConstellation[];
  onlyB: FrameConstellation[];
  /** Jaccard similarity of the constellation sets, 0..1 */
  overlap: number;
  sharedPlanets: FrameBody[];
  zenithA: StarFact | null;
  zenithB: StarFact | null;
  /** angular distance between the two zenith stars in degrees (celestial) */
  zenithSeparationDeg: number | null;
  risingA: FrameConstellation | null;
  risingB: FrameConstellation | null;
  sameRising: boolean;
  moonA: MoonFact | null;
  moonB: MoonFact | null;
  moonIlluminationDiff: number | null;
  sameMoonSign: boolean;
};

export function compareSkies(a: SkyFrame, b: SkyFrame): SkyComparison {
  const above = (f: SkyFrame) => new Set(constellationsAbove(f).map((c) => c.id));
  const setA = above(a);
  const setB = above(b);
  const shared = [...setA].filter((id) => setB.has(id));
  const union = new Set([...setA, ...setB]);

  const byId = (f: SkyFrame, id: string) => f.constellations.find((c) => c.id === id)!;

  const planetsA = new Set(bodiesAbove(a).filter((x) => x.kind === "planet").map((x) => x.id));
  const sharedPlanets = bodiesAbove(b).filter((x) => x.kind === "planet" && planetsA.has(x.id));

  const zenithA = zenithStar(a);
  const zenithB = zenithStar(b);
  let zenithSeparationDeg: number | null = null;
  if (zenithA && zenithB) {
    // compare in equatorial coordinates (fixed on the sky)
    const ra1 = zenithA.star.ra * DEG2RAD;
    const de1 = zenithA.star.dec * DEG2RAD;
    const ra2 = zenithB.star.ra * DEG2RAD;
    const de2 = zenithB.star.dec * DEG2RAD;
    const c =
      Math.sin(de1) * Math.sin(de2) + Math.cos(de1) * Math.cos(de2) * Math.cos(ra1 - ra2);
    zenithSeparationDeg = Math.acos(Math.max(-1, Math.min(1, c))) * RAD2DEG;
  }

  const risingA = risingConstellation(a);
  const risingB = risingConstellation(b);
  const moonA = moonFact(a);
  const moonB = moonFact(b);

  return {
    sharedConstellations: shared.map((id) => byId(a, id)),
    onlyA: [...setA].filter((id) => !setB.has(id)).map((id) => byId(a, id)),
    onlyB: [...setB].filter((id) => !setA.has(id)).map((id) => byId(b, id)),
    overlap: union.size ? shared.length / union.size : 0,
    sharedPlanets,
    zenithA,
    zenithB,
    zenithSeparationDeg,
    risingA,
    risingB,
    sameRising: !!risingA && !!risingB && risingA.id === risingB.id,
    moonA,
    moonB,
    moonIlluminationDiff:
      moonA && moonB ? Math.abs(moonA.illumination - moonB.illumination) : null,
    sameMoonSign: !!moonA && !!moonB && moonA.sign === moonB.sign,
  };
}

export function constellationName(c: FrameConstellation, locale: SkyLocale): string {
  return c.names[locale] || c.names.en;
}

const ZODIAC_NAMES: Record<SkyLocale, Record<string, string>> = {
  en: {},
  tr: {
    Aries: "Koç", Taurus: "Boğa", Gemini: "İkizler", Cancer: "Yengeç", Leo: "Aslan", Virgo: "Başak",
    Libra: "Terazi", Scorpio: "Akrep", Sagittarius: "Yay", Capricorn: "Oğlak", Aquarius: "Kova", Pisces: "Balık",
  },
  de: {
    Aries: "Widder", Taurus: "Stier", Gemini: "Zwillinge", Cancer: "Krebs", Leo: "Löwe", Virgo: "Jungfrau",
    Libra: "Waage", Scorpio: "Skorpion", Sagittarius: "Schütze", Capricorn: "Steinbock", Aquarius: "Wassermann", Pisces: "Fische",
  },
  es: {
    Aries: "Aries", Taurus: "Tauro", Gemini: "Géminis", Cancer: "Cáncer", Leo: "Leo", Virgo: "Virgo",
    Libra: "Libra", Scorpio: "Escorpio", Sagittarius: "Sagitario", Capricorn: "Capricornio", Aquarius: "Acuario", Pisces: "Piscis",
  },
};

export function zodiacName(sign: string, locale: SkyLocale): string {
  return ZODIAC_NAMES[locale]?.[sign] ?? sign;
}

export function bodyName(b: FrameBody, locale: SkyLocale): string {
  return b.names[locale] || b.names.en;
}
