import { RAD2DEG } from "./angles";

export const COMPASS_8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type CompassPoint = (typeof COMPASS_8)[number];

export function compassLabel(azRad: number): CompassPoint {
  const deg = (((azRad * RAD2DEG) % 360) + 360) % 360;
  return COMPASS_8[Math.round(deg / 45) % 8];
}

export function fmtDeg(rad: number, pad = 3): string {
  const d = Math.round((((rad * RAD2DEG) % 360) + 360) % 360);
  return `${String(d).padStart(pad, "0")}°`;
}

export function fmtAlt(rad: number): string {
  const d = Math.round(rad * RAD2DEG);
  return `${d >= 0 ? "+" : "−"}${String(Math.abs(d)).padStart(2, "0")}°`;
}
