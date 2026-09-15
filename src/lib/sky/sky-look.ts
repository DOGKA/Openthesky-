/**
 * Map the phone's back-camera look direction onto the sky (altitude / azimuth).
 *
 * Device frame (iOS/Android): +X right, +Y top of the phone, +Z out of the
 * screen (towards the user). The rear camera looks along −Z, so holding the
 * phone like a viewfinder points the view at whatever the camera sees.
 *
 * Gravity (accelerometer) gives "down"; the magnetometer's horizontal
 * component gives magnetic north. Azimuth is clockwise from north, matching
 * the rest of the sky engine. Magnetic declination is ignored (a few degrees).
 */
import { clamp, normalizeAz, TWO_PI } from "./sky-math";

export type Vec3 = { x: number; y: number; z: number };

export type DeviceLook = {
  alt: number;
  az: number;
  /** 0..1, how usable the magnetometer reading is */
  headingQuality: number;
};

function hypot3(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

function norm(v: Vec3): Vec3 | null {
  const n = hypot3(v);
  if (n < 1e-6) return null;
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/** Rear-camera look in device coordinates. */
const LOOK: Vec3 = { x: 0, y: 0, z: -1 };

export function deviceLookFromSensors(gravity: Vec3, magnetic: Vec3): DeviceLook | null {
  const down = norm(gravity);
  if (!down) return null;
  const up = scale(down, -1);

  const sinAlt = clamp(dot(LOOK, up), -1, 1);
  const alt = Math.asin(sinAlt);

  const mag = norm(magnetic);
  if (!mag) return { alt, az: 0, headingQuality: 0 };

  // Horizontal north = mag minus the component along down
  const magH = sub(mag, scale(down, dot(mag, down)));
  const north = norm(magH);
  const magHLen = hypot3(magH);
  // When the phone is vertical the field is usable (~0.3+); pointing at the
  // zenith it collapses. Quality also drops if the total field is tiny (simulator).
  const field = hypot3(magnetic);
  const headingQuality = clamp(magHLen * clamp(field / 20, 0, 1), 0, 1);
  if (!north || headingQuality < 0.08) {
    return { alt, az: 0, headingQuality };
  }

  const east = norm(cross(down, north));
  if (!east) return { alt, az: 0, headingQuality };

  let lookH = sub(LOOK, scale(up, sinAlt));
  const lookHN = norm(lookH);
  if (!lookHN) {
    // Looking straight up/down: azimuth is undefined. Keep 0; the hook holds last.
    return { alt, az: 0, headingQuality: headingQuality * 0.2 };
  }

  const az = normalizeAz(Math.atan2(dot(lookHN, east), dot(lookHN, north)));
  return { alt, az, headingQuality };
}

/** Shortest-path interpolation on a circle. */
export function lerpAz(from: number, to: number, t: number): number {
  let d = to - from;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return normalizeAz(from + d * t);
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
