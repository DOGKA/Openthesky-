import { clamp, DEG2RAD, TWO_PI } from "./angles";

export type Horizontal = { alt: number; az: number };

/**
 * Horizontal position plus its unit vector (x = north, y = east, z = up).
 * The vector costs no extra trigonometry here and lets the renderer project a
 * point with three dot products instead of four sin/cos calls per frame.
 */
export type HorizontalVec = Horizontal & { vx: number; vy: number; vz: number };

/** Equatorial → horizontal. Azimuth 0 = North, increasing eastward. */
function hourAngleToHorizontal(
  ha: number,
  sinDec: number,
  cosDec: number,
  sinLat: number,
  cosLat: number
): HorizontalVec {
  const sinHa = Math.sin(ha);
  const sinAlt = sinDec * sinLat + cosDec * cosLat * Math.cos(ha);
  const alt = Math.asin(clamp(sinAlt, -1, 1));
  const cosAlt = Math.cos(alt);
  const cosAz = (sinDec - sinAlt * sinLat) / (cosAlt * cosLat);
  let az = Math.acos(clamp(cosAz, -1, 1));
  if (sinHa > 0) az = TWO_PI - az;
  return {
    alt,
    az,
    vx: (sinDec - sinAlt * sinLat) / cosLat,
    vy: -cosDec * sinHa,
    vz: sinAlt,
  };
}

export function makeHorizontalTransform(lstDeg: number, latRad: number) {
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  return (raDeg: number, sinDec: number, cosDec: number): HorizontalVec => {
    let ha = (lstDeg - raDeg) * DEG2RAD;
    ha %= TWO_PI;
    if (ha < 0) ha += TWO_PI;
    return hourAngleToHorizontal(ha, sinDec, cosDec, sinLat, cosLat);
  };
}
