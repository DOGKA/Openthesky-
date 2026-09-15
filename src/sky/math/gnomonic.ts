import { clamp, normalizeAz } from "./angles";
import type { Horizontal } from "./equatorial";

export type Projected = { x: number; y: number };

/**
 * Gnomonic projection around (alt0, az0). x grows left with azimuth (inside view).
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
  return {
    x: -(cosAlt * Math.sin(dAz)) / cosc,
    y: (cosAlt0 * sinAlt - sinAlt0 * cosAlt * cosDAz) / cosc,
  };
}

export function unprojectGnomonic(x: number, y: number, alt0: number, az0: number): Horizontal {
  const xs = -x;
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

export function focalScale(fovRad: number, widthPx: number): number {
  return widthPx / 2 / Math.tan(fovRad / 2);
}

export function magLimitForFov(fovDeg: number): number {
  const t = (75 - clamp(fovDeg, 6, 75)) / 69;
  return 4.2 + t * 1.8;
}
