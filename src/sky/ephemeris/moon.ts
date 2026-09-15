import { DEG2RAD } from "@/sky/math";
import { eclipticToEquatorial, norm360 } from "./kepler";
import type { Vec3 } from "./types";

export function moonEcliptic(T: number) {
  const Lp = norm360(218.3164477 + 481267.88123421 * T);
  const D = norm360(297.8501921 + 445267.1114034 * T) * DEG2RAD;
  const M = norm360(357.5291092 + 35999.0502909 * T) * DEG2RAD;
  const Mp = norm360(134.9633964 + 477198.8675055 * T) * DEG2RAD;
  const F = norm360(93.272095 + 483202.0175233 * T) * DEG2RAD;
  const s = Math.sin;
  const c = Math.cos;

  const dLon =
    6.288774 * s(Mp) +
    1.274027 * s(2 * D - Mp) +
    0.658314 * s(2 * D) +
    0.213618 * s(2 * Mp) -
    0.185116 * s(M) -
    0.114332 * s(2 * F) +
    0.058793 * s(2 * D - 2 * Mp) +
    0.057066 * s(2 * D - M - Mp) +
    0.053322 * s(2 * D + Mp) +
    0.045758 * s(2 * D - M) -
    0.040923 * s(M - Mp) -
    0.03472 * s(D) -
    0.030383 * s(M + Mp) +
    0.015327 * s(2 * D - 2 * F) -
    0.012528 * s(Mp + 2 * F) +
    0.01098 * s(Mp - 2 * F) +
    0.010675 * s(4 * D - Mp) +
    0.010034 * s(3 * Mp) +
    0.008548 * s(4 * D - 2 * Mp);

  const lat =
    5.128122 * s(F) +
    0.280602 * s(Mp + F) +
    0.277693 * s(Mp - F) +
    0.173237 * s(2 * D - F) +
    0.055413 * s(2 * D - Mp + F) +
    0.046271 * s(2 * D - Mp - F) +
    0.032573 * s(2 * D + F) +
    0.017198 * s(2 * Mp + F) +
    0.009266 * s(2 * D + Mp - F) +
    0.008822 * s(2 * Mp - F);

  const dist =
    385000.56 -
    20905.355 * c(Mp) -
    3699.111 * c(2 * D - Mp) -
    2955.968 * c(2 * D) -
    569.925 * c(2 * Mp) +
    246.158 * c(2 * D - 2 * Mp) -
    204.586 * c(2 * D - M - Mp) -
    170.733 * c(2 * D + Mp) -
    152.138 * c(2 * D - M);

  return { lon: norm360(Lp + dLon), lat, dist };
}

export function moonEquatorial(T: number, eps: number) {
  const m = moonEcliptic(T);
  const lon = m.lon * DEG2RAD;
  const lat = m.lat * DEG2RAD;
  const v: Vec3 = {
    x: Math.cos(lat) * Math.cos(lon),
    y: Math.cos(lat) * Math.sin(lon),
    z: Math.sin(lat),
  };
  return { ...eclipticToEquatorial(v, eps), lon: m.lon, lat: m.lat };
}
