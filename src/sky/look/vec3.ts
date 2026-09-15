export type Vec3 = { x: number; y: number; z: number };

export function hypot3(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function norm(v: Vec3): Vec3 | null {
  const n = hypot3(v);
  if (n < 1e-6) return null;
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}
