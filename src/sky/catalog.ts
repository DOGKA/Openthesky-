import type { Locale } from "@/i18n";
import { DEG2RAD, starBucket, starColor, type StarBucket } from "@/sky/math";
import type { BodyData } from "@/sky/ephemeris";

type RawStar = [ra: number, dec: number, mag: number, bv: number, ly: number, name?: string, desig?: string];

type RawConstellation = {
  id: string;
  rank: number;
  ra: number;
  dec: number;
  names: Record<Locale, string>;
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
  sinDec: number;
  cosDec: number;
  mag: number;
  bv: number;
  bucket: StarBucket;
  color: string;
  ly: number;
  name?: string;
  desig?: string;
};

export type Constellation = {
  id: string;
  rank: number;
  ra: number;
  dec: number;
  names: Record<Locale, string>;
  lines: [number, number][][];
};

export type SkyCatalog = {
  stars: Star[];
  constellations: Constellation[];
  bodies: BodyData[];
  magLimit: number;
};

let cached: SkyCatalog | null = null;

export function loadSkyCatalog(): SkyCatalog {
  if (cached) return cached;
  const raw = require("../../assets/data/sky.json") as RawSky;
  cached = {
    stars: raw.stars.map(([ra, dec, mag, bv, ly, name, desig]) => {
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
    }),
    constellations: raw.constellations,
    bodies: raw.bodies ?? [],
    magLimit: raw.meta.magLimit,
  };
  return cached;
}
