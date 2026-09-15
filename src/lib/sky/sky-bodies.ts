/**
 * Geocentric positions of the Sun, Moon and naked-eye planets.
 *
 * Planets and Sun: JPL "approximate positions of the planets" method using
 * the J2000 Keplerian elements + per-century rates bundled in sky.json (they
 * come from d3-celestial's planets.json). Accuracy is a few arc-minutes for
 * the inner planets over 1800–2050, ample for a sky marker.
 *
 * Moon: truncated Meeus series (Astronomical Algorithms ch. 47), roughly 0.3°.
 * Positions are geocentric; topocentric parallax (< 1°) is ignored.
 *
 * All returned angles are in degrees.
 */
import { DEG2RAD, RAD2DEG } from "./sky-math";

export type BodyKind = "sun" | "moon" | "planet" | "earth";

export type BodyElements = {
  a: number;
  e: number;
  i: number;
  L: number;
  W: number; // longitude of perihelion ϖ
  N: number; // longitude of ascending node Ω
  da: number;
  de: number;
  di: number;
  dL: number;
  dW: number;
  dN: number;
};

export type BodyData = {
  id: string;
  kind: BodyKind;
  /** absolute magnitude H (planets) */
  H: number;
  names: Record<"en" | "tr" | "de" | "es", string>;
  elements: BodyElements | null;
};

export type Body = {
  id: string;
  kind: Exclude<BodyKind, "earth">;
  names: BodyData["names"];
  ra: number;
  dec: number;
  mag: number;
  /** geocentric ecliptic longitude, 0..360 */
  eclLon: number;
  /** Moon only: illuminated fraction 0..1 */
  illumination?: number;
  /** Moon only: elongation from the Sun in degrees, 0..180 */
  elongation?: number;
};

type Vec3 = { x: number; y: number; z: number };

/** Julian Day from a JS Date. */
export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Mean obliquity of the ecliptic (radians) for T centuries since J2000. */
function obliquity(T: number): number {
  return (23.439292 - 0.0130042 * T - 1.667e-7 * T * T + 5.028e-7 * T * T * T) * DEG2RAD;
}

function norm360(deg: number): number {
  deg %= 360;
  return deg < 0 ? deg + 360 : deg;
}

function norm180(deg: number): number {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
}

/** Solve Kepler's equation E − e·sin E = M (radians). */
function eccentricAnomaly(M: number, e: number): number {
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 30; k++) {
    const dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

/** Heliocentric ecliptic rectangular coordinates (AU) and distance. */
function heliocentric(el: BodyElements, T: number): Vec3 & { r: number } {
  const a = el.a + el.da * T;
  const e = el.e + el.de * T;
  const I = (el.i + el.di * T) * DEG2RAD;
  const L = el.L + el.dL * T;
  const W = el.W + el.dW * T;
  const N = el.N + el.dN * T;

  const omega = (W - N) * DEG2RAD; // argument of perihelion
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

/** Ecliptic rectangular → equatorial RA/Dec (degrees) + distance. */
function eclipticToEquatorial(v: Vec3, eps: number) {
  const ce = Math.cos(eps);
  const se = Math.sin(eps);
  const xeq = v.x;
  const yeq = v.y * ce - v.z * se;
  const zeq = v.y * se + v.z * ce;
  const ra = norm360(Math.atan2(yeq, xeq) * RAD2DEG);
  const dec = Math.atan2(zeq, Math.hypot(xeq, yeq)) * RAD2DEG;
  return { ra, dec, dist: Math.hypot(xeq, yeq, zeq) };
}

/**
 * Apparent magnitude of a planet from its absolute magnitude H, heliocentric
 * distance rs and geocentric distance rt (d3-celestial's phase formula).
 */
function planetMagnitude(H: number, rs: number, rt: number): number {
  const cosA = (rs * rs + rt * rt - 1) / (2 * rs * rt);
  const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const q = 0.666 * ((1 - a / Math.PI) * Math.cos(a) + Math.sin(a) / Math.PI);
  return H + 5 * Math.log10(rs * rt) - 2.5 * Math.log10(Math.max(q, 1e-6));
}

/** Geocentric ecliptic lon/lat (degrees) and distance (km) of the Moon. */
function moonEcliptic(T: number) {
  const Lp = norm360(218.3164477 + 481267.88123421 * T); // mean longitude
  const D = norm360(297.8501921 + 445267.1114034 * T) * DEG2RAD; // mean elongation
  const M = norm360(357.5291092 + 35999.0502909 * T) * DEG2RAD; // Sun mean anomaly
  const Mp = norm360(134.9633964 + 477198.8675055 * T) * DEG2RAD; // Moon mean anomaly
  const F = norm360(93.272095 + 483202.0175233 * T) * DEG2RAD; // argument of latitude

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

function eclipticSphericalToEquatorial(lonDeg: number, latDeg: number, eps: number) {
  const lon = lonDeg * DEG2RAD;
  const lat = latDeg * DEG2RAD;
  const v: Vec3 = {
    x: Math.cos(lat) * Math.cos(lon),
    y: Math.cos(lat) * Math.sin(lon),
    z: Math.sin(lat),
  };
  return eclipticToEquatorial(v, eps);
}

/**
 * Compute all drawable bodies for a date. `data` is the `bodies` array from
 * sky.json; Earth must be present (it is the origin for the others).
 */
export function computeBodies(date: Date, data: BodyData[]): Body[] {
  const T = (julianDay(date) - 2451545.0) / 36525;
  const eps = obliquity(T);

  const earthData = data.find((b) => b.kind === "earth");
  if (!earthData?.elements) return [];
  const earth = heliocentric(earthData.elements, T);

  // Sun = −Earth vector
  const sunVec: Vec3 = { x: -earth.x, y: -earth.y, z: -earth.z };
  const sunLon = norm360(Math.atan2(sunVec.y, sunVec.x) * RAD2DEG);

  const out: Body[] = [];

  for (const b of data) {
    if (b.kind === "earth") continue;

    if (b.kind === "sun") {
      const eq = eclipticToEquatorial(sunVec, eps);
      out.push({ id: b.id, kind: "sun", names: b.names, ra: eq.ra, dec: eq.dec, mag: -26.7, eclLon: sunLon });
      continue;
    }

    if (b.kind === "moon") {
      const m = moonEcliptic(T);
      const eq = eclipticSphericalToEquatorial(m.lon, m.lat, eps);
      const dLon = (m.lon - sunLon) * DEG2RAD;
      const cosPsi = Math.cos(m.lat * DEG2RAD) * Math.cos(dLon);
      const psi = Math.acos(Math.max(-1, Math.min(1, cosPsi))); // elongation
      const phaseAngle = Math.PI - psi; // Sun–Moon–Earth angle (small when full)
      const illumination = (1 + Math.cos(phaseAngle)) / 2;
      // Allen's empirical lunar magnitude vs. phase angle
      const pa = Math.abs(phaseAngle);
      const mag = -12.73 + 1.49 * pa + 0.043 * Math.pow(pa, 4);
      out.push({
        id: b.id,
        kind: "moon",
        names: b.names,
        ra: eq.ra,
        dec: eq.dec,
        mag,
        eclLon: m.lon,
        illumination,
        elongation: psi * RAD2DEG,
      });
      continue;
    }

    if (!b.elements) continue;
    const h = heliocentric(b.elements, T);
    const geo: Vec3 = { x: h.x - earth.x, y: h.y - earth.y, z: h.z - earth.z };
    const eq = eclipticToEquatorial(geo, eps);
    out.push({
      id: b.id,
      kind: "planet",
      names: b.names,
      ra: eq.ra,
      dec: eq.dec,
      mag: planetMagnitude(b.H, h.r, eq.dist),
      eclLon: norm360(Math.atan2(geo.y, geo.x) * RAD2DEG),
    });
  }

  return out;
}

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

/** Tropical zodiac sign for an ecliptic longitude. */
export function zodiacSign(eclLon: number): (typeof ZODIAC_SIGNS)[number] {
  return ZODIAC_SIGNS[Math.floor(norm360(eclLon) / 30) % 12];
}
