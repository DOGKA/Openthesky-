import {
  clamp,
  DEG2RAD,
  getLocalSiderealTime,
  makeHorizontalTransform,
  type HorizontalVec,
} from "@/sky/math";
import { loadSkyCatalog, type Constellation, type Star } from "./catalog";
import { computeBodies, type Body } from "@/sky/ephemeris";

export type FrameStar = Star & HorizontalVec;
export type FrameBody = Body & HorizontalVec;

export type FrameConstellation = Omit<Constellation, "lines"> & {
  center: HorizontalVec;
  lines: HorizontalVec[][];
};

export type SkyFrame = {
  date: Date;
  latitude: number;
  longitude: number;
  lstDeg: number;
  stars: FrameStar[];
  constellations: FrameConstellation[];
  bodies: FrameBody[];
};

export function computeSkyFrame(latitude: number, longitude: number, date: Date): SkyFrame {
  const catalog = loadSkyCatalog();
  const lstDeg = getLocalSiderealTime(date, longitude);
  const latRad = clamp(latitude, -89.9, 89.9) * DEG2RAD;
  const toHorizontal = makeHorizontalTransform(lstDeg, latRad);

  const stars: FrameStar[] = catalog.stars.map((s) => ({
    ...s,
    ...toHorizontal(s.ra, s.sinDec, s.cosDec),
  }));

  const constellations: FrameConstellation[] = catalog.constellations.map((c) => {
    const decRad = c.dec * DEG2RAD;
    return {
      id: c.id,
      rank: c.rank,
      ra: c.ra,
      dec: c.dec,
      names: c.names,
      center: toHorizontal(c.ra, Math.sin(decRad), Math.cos(decRad)),
      lines: c.lines.map((poly) =>
        poly.map(([ra, dec]) => {
          const d = dec * DEG2RAD;
          return toHorizontal(ra, Math.sin(d), Math.cos(d));
        })
      ),
    };
  });

  const bodies: FrameBody[] = computeBodies(date, catalog.bodies).map((b) => {
    const decRad = b.dec * DEG2RAD;
    return { ...b, ...toHorizontal(b.ra, Math.sin(decRad), Math.cos(decRad)) };
  });

  return { date, latitude, longitude, lstDeg, stars, constellations, bodies };
}
