/**
 * Typed access to the bundled sky catalogue (assets/data/sky.json), generated
 * from d3-celestial by `scripts/build-sky-data.js`.
 */
import { DEG2RAD, starBucket, starColor, type StarBucket } from "./sky-math";
import type { BodyData } from "./sky-bodies";

export type SkyLocale = "en" | "tr" | "de" | "es";

type RawStar = [
  ra: number,
  dec: number,
  mag: number,
  bv: number,
  ly: number,
  name?: string,
  desig?: string,
];

type RawConstellation = {
  id: string;
  rank: number;
  ra: number;
  dec: number;
  names: Record<SkyLocale, string>;
  lines: [number, number][][];
};

type RawSky = {
  meta: { magLimit: number; nameMagLimit: number; starCount: number };
  stars: RawStar[];
  constellations: RawConstellation[];
  bodies: BodyData[];
};

export type Star = {
  ra: number;
  dec: number;
  /** precomputed for the equatorial→horizontal transform */
  sinDec: number;
  cosDec: number;
  mag: number;
  bv: number;
  bucket: StarBucket;
  color: string;
  /** distance in light years, 0 if unknown */
  ly: number;
  /** proper name, e.g. "Vega" */
  name?: string;
  /** Bayer/Flamsteed designation + constellation, e.g. "α Lyr" */
  desig?: string;
};

export type Constellation = {
  id: string;
  rank: number;
  ra: number;
  dec: number;
  names: Record<SkyLocale, string>;
  /** polylines, each vertex as [ra, dec] in degrees */
  lines: [number, number][][];
};

export type SkyCatalog = {
  stars: Star[]; // sorted brightest → faintest
  constellations: Constellation[];
  /** orbital elements + names for Sun, Moon, Earth and planets */
  bodies: BodyData[];
  magLimit: number;
};

let cached: SkyCatalog | null = null;

export function loadSkyCatalog(): SkyCatalog {
  if (cached) return cached;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const raw = require("../../../assets/data/sky.json") as RawSky;

  const stars: Star[] = raw.stars.map(([ra, dec, mag, bv, ly, name, desig]) => {
    const decRad = dec * DEG2RAD;
    return {
      ra,
      dec,
      sinDec: Math.sin(decRad),
      cosDec: Math.cos(decRad),
      mag,
      bv,
      bucket: starBucket(mag),
      color: starColor(bv),
      ly,
      name: name || undefined,
      desig,
    };
  });

  cached = {
    stars,
    constellations: raw.constellations,
    bodies: raw.bodies ?? [],
    magLimit: raw.meta.magLimit,
  };
  return cached;
}

export function constellationName(c: Constellation, locale: SkyLocale): string {
  return c.names[locale] || c.names.en;
}
