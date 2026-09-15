import {
  clamp,
  DEG2RAD,
  equatorialVector,
  getLocalSiderealTime,
  makeHorizontalRotation,
  type HorizontalVec,
} from "@/sky/math";
import { loadSkyCatalog, type Constellation, type Star } from "./catalog";
import { computeBodies, type Body } from "@/sky/ephemeris";

export type FrameStar = Star & HorizontalVec;
export type FrameBody = Body & HorizontalVec;

export type FrameConstellation = Omit<Constellation, "lines" | "lineVectors" | "centerVector"> & {
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
  const rotate = makeHorizontalRotation(lstDeg, latRad);

  // Written out field by field on purpose: `{ ...s, ...rotate(...) }` for 5044
  // stars measures ~11ms per frame, this loop ~0.25ms. The scrubber recomputes
  // the frame while dragging, so that difference is the whole feel of it.
  const stars: FrameStar[] = new Array(catalog.stars.length);
  for (let i = 0; i < catalog.stars.length; i++) {
    const s = catalog.stars[i];
    const h = rotate(s.ex, s.ey, s.ez);
    stars[i] = {
      ra: s.ra,
      dec: s.dec,
      ex: s.ex,
      ey: s.ey,
      ez: s.ez,
      mag: s.mag,
      bv: s.bv,
      bucket: s.bucket,
      color: s.color,
      ly: s.ly,
      name: s.name,
      desig: s.desig,
      alt: h.alt,
      az: h.az,
      vx: h.vx,
      vy: h.vy,
      vz: h.vz,
    };
  }

  const constellations: FrameConstellation[] = catalog.constellations.map((c) => ({
    id: c.id,
    rank: c.rank,
    ra: c.ra,
    dec: c.dec,
    names: c.names,
    center: rotate(c.centerVector.x, c.centerVector.y, c.centerVector.z),
    lines: c.lineVectors.map((poly) => poly.map((v) => rotate(v.x, v.y, v.z))),
  }));

  const bodies: FrameBody[] = computeBodies(date, catalog.bodies).map((b) => {
    const v = equatorialVector(b.ra, b.dec);
    return { ...b, ...rotate(v.x, v.y, v.z) };
  });

  return { date, latitude, longitude, lstDeg, stars, constellations, bodies };
}
