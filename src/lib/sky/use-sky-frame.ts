/**
 * Turns the equatorial catalogue into horizontal (alt/az) coordinates for one
 * observer and one instant. Recomputed only when location or time changes,
 * never per gesture frame.
 */
import { useMemo } from "react";
import { loadSkyCatalog, type Constellation, type Star } from "./sky-data";
import { computeBodies, type Body } from "./sky-bodies";
import {
  DEG2RAD,
  TWO_PI,
  clamp,
  getLocalSiderealTime,
  type Horizontal,
} from "./sky-math";

export type FrameStar = Star & Horizontal;

export type FrameConstellation = Omit<Constellation, "lines"> & {
  center: Horizontal;
  lines: Horizontal[][];
};

export type FrameBody = Body & Horizontal;

export type SkyFrame = {
  date: Date;
  latitude: number;
  longitude: number;
  lstDeg: number;
  stars: FrameStar[]; // brightest first, includes stars below the horizon
  constellations: FrameConstellation[];
  /** Sun, Moon and planets, including those below the horizon */
  bodies: FrameBody[];
};

function makeTransform(lstDeg: number, latRad: number) {
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);

  return (raDeg: number, sinDec: number, cosDec: number): Horizontal => {
    let ha = (lstDeg - raDeg) * DEG2RAD;
    ha %= TWO_PI;
    if (ha < 0) ha += TWO_PI;

    const sinAlt = sinDec * sinLat + cosDec * cosLat * Math.cos(ha);
    const alt = Math.asin(clamp(sinAlt, -1, 1));
    const cosAz = (sinDec - sinAlt * sinLat) / (Math.cos(alt) * cosLat);
    let az = Math.acos(clamp(cosAz, -1, 1));
    if (Math.sin(ha) > 0) az = TWO_PI - az;
    return { alt, az };
  };
}

export function computeSkyFrame(
  latitude: number,
  longitude: number,
  date: Date
): SkyFrame {
  const catalog = loadSkyCatalog();
  const lstDeg = getLocalSiderealTime(date, longitude);
  // keep the observer a hair away from the poles to avoid a degenerate azimuth
  const latRad = clamp(latitude, -89.9, 89.9) * DEG2RAD;
  const toHorizontal = makeTransform(lstDeg, latRad);

  const stars: FrameStar[] = catalog.stars.map((s) => ({
    ...s,
    ...toHorizontal(s.ra, s.sinDec, s.cosDec),
  }));

  const constellations: FrameConstellation[] = catalog.constellations.map(
    (c) => {
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
    }
  );

  const bodies: FrameBody[] = computeBodies(date, catalog.bodies).map((b) => {
    const decRad = b.dec * DEG2RAD;
    return { ...b, ...toHorizontal(b.ra, Math.sin(decRad), Math.cos(decRad)) };
  });

  return { date, latitude, longitude, lstDeg, stars, constellations, bodies };
}

export function useSkyFrame(
  latitude: number | null,
  longitude: number | null,
  date: Date
): SkyFrame | null {
  // Quantise to the minute: the sky moves 0.25°/min, far below one pixel of
  // motion at any field of view we render.
  const minute = Math.floor(date.getTime() / 60000);
  return useMemo(() => {
    if (latitude == null || longitude == null) return null;
    return computeSkyFrame(latitude, longitude, new Date(minute * 60000));
  }, [latitude, longitude, minute]);
}
