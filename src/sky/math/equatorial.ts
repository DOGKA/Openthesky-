import { clamp, DEG2RAD, normalizeAz } from "./angles";

export type Horizontal = { alt: number; az: number };

/**
 * Horizontal position plus its unit vector (x = north, y = east, z = up).
 * The vector lets the renderer project a point with three dot products
 * instead of four sin/cos calls per frame.
 */
export type HorizontalVec = Horizontal & { vx: number; vy: number; vz: number };

/** Unit vector in the equatorial frame, fixed for a star. */
export type EquatorialVec = { x: number; y: number; z: number };

export function equatorialVector(raDeg: number, decDeg: number): EquatorialVec {
  const ra = raDeg * DEG2RAD;
  const dec = decDeg * DEG2RAD;
  const cosDec = Math.cos(dec);
  return { x: cosDec * Math.cos(ra), y: cosDec * Math.sin(ra), z: Math.sin(dec) };
}

/**
 * Time and latitude only rotate the sky, so going from equatorial to
 * horizontal is one rotation rather than per-point trigonometry: the sidereal
 * and latitude terms are computed once here, leaving multiply-adds per point.
 */
export function makeHorizontalRotation(lstDeg: number, latRad: number) {
  const lst = lstDeg * DEG2RAD;
  const cosLst = Math.cos(lst);
  const sinLst = Math.sin(lst);
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);

  return (x: number, y: number, z: number): HorizontalVec => {
    // a = cos(dec)cos(HA), b = cos(dec)sin(HA) with HA = LST - RA
    const a = x * cosLst + y * sinLst;
    const b = x * sinLst - y * cosLst;
    const vx = z * cosLat - a * sinLat;
    const vy = -b;
    const vz = z * sinLat + a * cosLat;
    return {
      alt: Math.asin(clamp(vz, -1, 1)),
      az: normalizeAz(Math.atan2(vy, vx)),
      vx,
      vy,
      vz,
    };
  };
}
