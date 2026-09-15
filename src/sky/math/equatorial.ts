import { clamp, DEG2RAD, TWO_PI } from "./angles";

export type Horizontal = { alt: number; az: number };

/**
 * Equatorial → horizontal. Azimuth 0 = North, increasing eastward.
 */
export function equatorialToHorizontal(
  raDeg: number,
  decDeg: number,
  lstDeg: number,
  latRad: number
): Horizontal {
  let ha = (lstDeg - raDeg) * DEG2RAD;
  ha %= TWO_PI;
  if (ha < 0) ha += TWO_PI;

  const dec = decDeg * DEG2RAD;
  return hourAngleToHorizontal(ha, Math.sin(dec), Math.cos(dec), Math.sin(latRad), Math.cos(latRad));
}

export function hourAngleToHorizontal(
  ha: number,
  sinDec: number,
  cosDec: number,
  sinLat: number,
  cosLat: number
): Horizontal {
  const sinAlt = sinDec * sinLat + cosDec * cosLat * Math.cos(ha);
  const alt = Math.asin(clamp(sinAlt, -1, 1));
  const cosAz = (sinDec - sinAlt * sinLat) / (Math.cos(alt) * cosLat);
  let az = Math.acos(clamp(cosAz, -1, 1));
  if (Math.sin(ha) > 0) az = TWO_PI - az;
  return { alt, az };
}

export function makeHorizontalTransform(lstDeg: number, latRad: number) {
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  return (raDeg: number, sinDec: number, cosDec: number): Horizontal => {
    let ha = (lstDeg - raDeg) * DEG2RAD;
    ha %= TWO_PI;
    if (ha < 0) ha += TWO_PI;
    return hourAngleToHorizontal(ha, sinDec, cosDec, sinLat, cosLat);
  };
}
