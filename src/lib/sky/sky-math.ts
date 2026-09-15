/**
 * Pure astronomical math for the "Open the Sky" feature.
 *
 * Coordinate conventions:
 * - Equatorial (RA, Dec) in degrees, RA 0..360, J2000 (as stored in sky.json).
 * - Horizontal (alt, az) in radians. Azimuth 0 = North, increasing eastward
 *   (E = π/2, S = π, W = 3π/2), matching d3-celestial's horizontal.js.
 *
 * The sidereal-time and equatorial→horizontal formulas are a port of
 * d3-celestial/src/horizontal.js.
 */

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
export const TWO_PI = Math.PI * 2;

/** Local mean sidereal time in degrees for a date and an east longitude. */
export function getLocalSiderealTime(date: Date, lngDeg: number): number {
  let yr = date.getUTCFullYear();
  let mo = date.getUTCMonth() + 1;
  const dy = date.getUTCDate();
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const s = date.getUTCSeconds();

  if (mo === 1 || mo === 2) {
    yr -= 1;
    mo += 12;
  }

  const a = Math.floor(yr / 100);
  const b = 2 - a + Math.floor(a / 4);
  const c = Math.floor(365.25 * yr);
  const d = Math.floor(30.6001 * (mo + 1));

  // days since J2000.0
  const jd = b + c + d - 730550.5 + dy + (h + m / 60 + s / 3600) / 24;
  const jt = jd / 36525;

  let mst =
    280.46061837 +
    360.98564736629 * jd +
    0.000387933 * jt * jt -
    (jt * jt * jt) / 38710000 +
    lngDeg;

  mst %= 360;
  if (mst < 0) mst += 360;
  return mst;
}

export type Horizontal = { alt: number; az: number };

/**
 * Equatorial → horizontal.
 * @param raDeg   right ascension in degrees
 * @param decDeg  declination in degrees
 * @param lstDeg  local sidereal time in degrees (see getLocalSiderealTime)
 * @param latRad  observer latitude in radians
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
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinDec = Math.sin(dec);
  const cosDec = Math.cos(dec);

  const sinAlt = sinDec * sinLat + cosDec * cosLat * Math.cos(ha);
  const alt = Math.asin(clamp(sinAlt, -1, 1));

  const cosAz = (sinDec - sinAlt * sinLat) / (Math.cos(alt) * cosLat);
  let az = Math.acos(clamp(cosAz, -1, 1));
  if (Math.sin(ha) > 0) az = TWO_PI - az;

  return { alt, az };
}

export type Projected = { x: number; y: number };

/**
 * Gnomonic (rectilinear) projection: what a telescope / camera sees when
 * pointed at (alt0, az0). Returns tangent-plane coordinates (1 unit = tan 1 rad);
 * multiply by `focalScale` to get pixels. `x` grows to the LEFT for increasing
 * azimuth because we look at the sky from the inside (facing south, east is on
 * the left). `y` grows upward (towards higher altitude).
 *
 * Returns null for points behind the tangent plane.
 */
export function projectGnomonic(
  alt: number,
  az: number,
  alt0: number,
  az0: number,
  sinAlt0: number = Math.sin(alt0),
  cosAlt0: number = Math.cos(alt0)
): Projected | null {
  const dAz = az - az0;
  const sinAlt = Math.sin(alt);
  const cosAlt = Math.cos(alt);
  const cosDAz = Math.cos(dAz);

  const cosc = sinAlt0 * sinAlt + cosAlt0 * cosAlt * cosDAz;
  if (cosc <= 0.08) return null;

  const x = -(cosAlt * Math.sin(dAz)) / cosc;
  const y = (cosAlt0 * sinAlt - sinAlt0 * cosAlt * cosDAz) / cosc;
  return { x, y };
}

/** Inverse gnomonic: tangent-plane (x, y) around (alt0, az0) → (alt, az). */
export function unprojectGnomonic(
  x: number,
  y: number,
  alt0: number,
  az0: number
): Horizontal {
  const xs = -x; // undo the east-west mirror
  const rho = Math.sqrt(xs * xs + y * y);
  const c = Math.atan(rho);
  const sinC = Math.sin(c);
  const cosC = Math.cos(c);
  const sinAlt0 = Math.sin(alt0);
  const cosAlt0 = Math.cos(alt0);

  const alt = Math.asin(
    clamp(cosC * sinAlt0 + (rho === 0 ? 0 : (y * sinC * cosAlt0) / rho), -1, 1)
  );
  const dAz = Math.atan2(xs * sinC, rho * cosAlt0 * cosC - y * sinAlt0 * sinC);
  return { alt, az: normalizeAz(az0 + dAz) };
}

/** Pixels per tangent-plane unit for a horizontal field of view (radians). */
export function focalScale(fovRad: number, widthPx: number): number {
  return widthPx / 2 / Math.tan(fovRad / 2);
}

/**
 * Magnitude cutoff as a function of field of view. Wide views stay sparse and
 * "radar-like" (mag 4.5); zooming in reveals fainter stars so the frame never
 * looks empty.
 */
export function magLimitForFov(fovDeg: number): number {
  const t = (60 - clamp(fovDeg, 15, 60)) / 45; // 0 at ≥60°, 1 at ≤15°
  return 4.5 + t * 1.5; // 4.5 → 6.0
}

/**
 * Very desaturated colour from the B−V index. Keeps the industrial look: only a
 * hint of blue for hot stars and of amber for cool ones.
 */
export function starColor(bv: number): string {
  if (bv < 0.0) return "#cfe0ff";
  if (bv < 0.5) return "#eef3ff";
  if (bv < 1.0) return "#ffffff";
  if (bv < 1.5) return "#fff1dc";
  return "#ffdcb0";
}

/** Bucket used to batch stars into a handful of Skia <Points> draws. */
export type StarBucket = 0 | 1 | 2 | 3 | 4;
export const STAR_BUCKETS: StarBucket[] = [0, 1, 2, 3, 4];

export function starBucket(mag: number): StarBucket {
  if (mag < 1.0) return 0;
  if (mag < 2.2) return 1;
  if (mag < 3.4) return 2;
  if (mag < 4.6) return 3;
  return 4;
}

/** Dot diameter (px) per bucket at scale 1. */
export const BUCKET_SIZE: Record<StarBucket, number> = {
  0: 6.6,
  1: 4.6,
  2: 3.2,
  3: 2.2,
  4: 1.4,
};

export const BUCKET_OPACITY: Record<StarBucket, number> = {
  0: 1,
  1: 1,
  2: 0.92,
  3: 0.78,
  4: 0.55,
};

export const COMPASS_8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type CompassPoint = (typeof COMPASS_8)[number];

/** Compass label for an azimuth in radians. */
export function compassLabel(azRad: number): CompassPoint {
  const deg = (((azRad * RAD2DEG) % 360) + 360) % 360;
  return COMPASS_8[Math.round(deg / 45) % 8];
}

export function normalizeAz(az: number): number {
  az %= TWO_PI;
  return az < 0 ? az + TWO_PI : az;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Zero-padded degrees, e.g. 007° */
export function fmtDeg(rad: number, pad = 3): string {
  const d = Math.round((((rad * RAD2DEG) % 360) + 360) % 360);
  return `${String(d).padStart(pad, "0")}°`;
}

/** Signed degrees for altitude, e.g. +42° */
export function fmtAlt(rad: number): string {
  const d = Math.round(rad * RAD2DEG);
  return `${d >= 0 ? "+" : "−"}${String(Math.abs(d)).padStart(2, "0")}°`;
}
