import { clamp } from "./angles";

/** Pixels per unit on the tangent plane for a given field of view. */
export function focalScale(fovRad: number, widthPx: number): number {
  return widthPx / 2 / Math.tan(fovRad / 2);
}

/** Faintest magnitude worth drawing: a tight field earns dimmer stars. */
export function magLimitForFov(fovDeg: number): number {
  const t = (75 - clamp(fovDeg, 6, 75)) / 69;
  return 4.2 + t * 1.8;
}
