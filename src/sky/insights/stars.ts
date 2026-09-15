import { angularDistance, DEG2RAD, RAD2DEG } from "@/sky/math";
import type { FrameConstellation, FrameStar, SkyFrame } from "@/sky/frame";

export type StarFact = {
  star: FrameStar;
  label: string;
  fromZenithDeg: number;
  constellationId: string | null;
};

export function starLabel(s: FrameStar): string {
  return s.name || s.desig || `mag ${s.mag.toFixed(1)}`;
}

export function nearestConstellation(
  frame: SkyFrame,
  alt: number,
  az: number
): FrameConstellation | null {
  let best: FrameConstellation | null = null;
  let bestD = Infinity;
  for (const c of frame.constellations) {
    const d = angularDistance(c.center.alt, c.center.az, alt, az);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export function zenithStar(frame: SkyFrame): StarFact | null {
  const zenith = Math.PI / 2;
  for (const coneDeg of [8, 12, 18, 25, 40]) {
    const cone = coneDeg * DEG2RAD;
    let best: FrameStar | null = null;
    let bestScore = Infinity;
    for (const s of frame.stars) {
      if (s.mag > 4.5) break;
      const d = zenith - s.alt;
      if (d > cone) continue;
      const score = s.mag + (d / cone) * 1.5 - (s.name ? 0.8 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }
    if (best) {
      return {
        star: best,
        label: starLabel(best),
        fromZenithDeg: (zenith - best.alt) * RAD2DEG,
        constellationId: nearestConstellation(frame, best.alt, best.az)?.id ?? null,
      };
    }
  }
  return null;
}

export function risingConstellation(frame: SkyFrame): FrameConstellation | null {
  return nearestConstellation(frame, 8 * DEG2RAD, 90 * DEG2RAD);
}

export function settingConstellation(frame: SkyFrame): FrameConstellation | null {
  return nearestConstellation(frame, 8 * DEG2RAD, 270 * DEG2RAD);
}

export function lightYearStar(frame: SkyFrame, ageYears: number): FrameStar | null {
  if (!(ageYears > 0)) return null;
  let best: FrameStar | null = null;
  let bestErr = Infinity;
  for (const s of frame.stars) {
    if (!s.ly || !s.name) continue;
    const err = Math.abs(s.ly - ageYears) / ageYears;
    if (err < bestErr) {
      bestErr = err;
      best = s;
    }
  }
  return best;
}

export function ageInYears(birth: Date, at: Date = new Date()): number {
  return (at.getTime() - birth.getTime()) / (365.25 * 86400000);
}
