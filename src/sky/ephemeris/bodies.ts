import { DEG2RAD, RAD2DEG, julianDay, obliquity } from "@/sky/math";
import { eclipticToEquatorial, heliocentric, norm360, planetMagnitude } from "./kepler";
import { moonEquatorial } from "./moon";
import type { Body, BodyData, Vec3 } from "./types";

export function computeBodies(date: Date, data: BodyData[]): Body[] {
  const T = (julianDay(date) - 2451545.0) / 36525;
  const eps = obliquity(T);
  const earthData = data.find((b) => b.kind === "earth");
  if (!earthData?.elements) return [];

  const earth = heliocentric(earthData.elements, T);
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
      const m = moonEquatorial(T, eps);
      const dLon = (m.lon - sunLon) * DEG2RAD;
      const cosPsi = Math.cos(m.lat * DEG2RAD) * Math.cos(dLon);
      const psi = Math.acos(Math.max(-1, Math.min(1, cosPsi)));
      const phaseAngle = Math.PI - psi;
      const illumination = (1 + Math.cos(phaseAngle)) / 2;
      const pa = Math.abs(phaseAngle);
      out.push({
        id: b.id,
        kind: "moon",
        names: b.names,
        ra: m.ra,
        dec: m.dec,
        mag: -12.73 + 1.49 * pa + 0.043 * Math.pow(pa, 4),
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
