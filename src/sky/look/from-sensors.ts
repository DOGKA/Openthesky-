import { clamp, normalizeAz } from "@/sky/math";
import { cross, dot, hypot3, norm, scale, sub, type Vec3 } from "./vec3";

export type DeviceLook = {
  alt: number;
  az: number;
  headingQuality: number;
};

const LOOK: Vec3 = { x: 0, y: 0, z: -1 };

export function deviceLookFromSensors(gravity: Vec3, magnetic: Vec3): DeviceLook | null {
  const down = norm(gravity);
  if (!down) return null;
  const up = scale(down, -1);
  const sinAlt = clamp(dot(LOOK, up), -1, 1);
  const alt = Math.asin(sinAlt);

  const mag = norm(magnetic);
  if (!mag) return { alt, az: 0, headingQuality: 0 };

  const magH = sub(mag, scale(down, dot(mag, down)));
  const north = norm(magH);
  const headingQuality = clamp(hypot3(magH) * clamp(hypot3(magnetic) / 20, 0, 1), 0, 1);
  if (!north || headingQuality < 0.08) return { alt, az: 0, headingQuality };

  const east = norm(cross(down, north));
  if (!east) return { alt, az: 0, headingQuality };

  const lookHN = norm(sub(LOOK, scale(up, sinAlt)));
  if (!lookHN) return { alt, az: 0, headingQuality: headingQuality * 0.2 };

  return {
    alt,
    az: normalizeAz(Math.atan2(dot(lookHN, east), dot(lookHN, north))),
    headingQuality,
  };
}
