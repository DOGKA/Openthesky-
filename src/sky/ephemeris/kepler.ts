import { DEG2RAD, RAD2DEG } from "@/sky/math";
import type { BodyElements, Vec3 } from "./types";

export function norm360(deg: number): number {
  deg %= 360;
  return deg < 0 ? deg + 360 : deg;
}

export function norm180(deg: number): number {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
}

function eccentricAnomaly(M: number, e: number): number {
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 30; k++) {
    const dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

export function heliocentric(el: BodyElements, T: number): Vec3 & { r: number } {
  const a = el.a + el.da * T;
  const e = el.e + el.de * T;
  const I = (el.i + el.di * T) * DEG2RAD;
  const L = el.L + el.dL * T;
  const W = el.W + el.dW * T;
  const N = el.N + el.dN * T;
  const omega = (W - N) * DEG2RAD;
  const Omega = N * DEG2RAD;
  const M = norm180(L - W) * DEG2RAD;
  const E = eccentricAnomaly(M, e);
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(omega);
  const sw = Math.sin(omega);
  const cO = Math.cos(Omega);
  const sO = Math.sin(Omega);
  const cI = Math.cos(I);
  const sI = Math.sin(I);
  const x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  const y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  const z = sw * sI * xp + cw * sI * yp;
  return { x, y, z, r: Math.hypot(xp, yp) };
}

export function eclipticToEquatorial(v: Vec3, eps: number) {
  const ce = Math.cos(eps);
  const se = Math.sin(eps);
  const yeq = v.y * ce - v.z * se;
  const zeq = v.y * se + v.z * ce;
  const ra = norm360(Math.atan2(yeq, v.x) * RAD2DEG);
  const dec = Math.atan2(zeq, Math.hypot(v.x, yeq)) * RAD2DEG;
  return { ra, dec, dist: Math.hypot(v.x, yeq, zeq) };
}

export function planetMagnitude(H: number, rs: number, rt: number): number {
  const cosA = (rs * rs + rt * rt - 1) / (2 * rs * rt);
  const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const q = 0.666 * ((1 - a / Math.PI) * Math.cos(a) + Math.sin(a) / Math.PI);
  return H + 5 * Math.log10(rs * rt) - 2.5 * Math.log10(Math.max(q, 1e-6));
}
