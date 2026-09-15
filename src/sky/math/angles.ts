export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
export const TWO_PI = Math.PI * 2;

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function normalizeAz(az: number): number {
  az %= TWO_PI;
  return az < 0 ? az + TWO_PI : az;
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function lerpAz(from: number, to: number, t: number): number {
  let d = to - from;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return normalizeAz(from + d * t);
}

export function angularDistance(alt1: number, az1: number, alt2: number, az2: number): number {
  const c =
    Math.sin(alt1) * Math.sin(alt2) +
    Math.cos(alt1) * Math.cos(alt2) * Math.cos(az1 - az2);
  return Math.acos(clamp(c, -1, 1));
}
