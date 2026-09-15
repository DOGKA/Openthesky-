import { DEG2RAD } from "@/sky/math";
import { zodiacSign } from "@/sky/ephemeris";
import type { FrameBody, FrameConstellation, SkyFrame } from "@/sky/frame";

export type MoonFact = {
  body: FrameBody;
  illumination: number;
  waxing: boolean;
  sign: ReturnType<typeof zodiacSign>;
  aboveHorizon: boolean;
};

export function moonFact(frame: SkyFrame): MoonFact | null {
  const moon = frame.bodies.find((b) => b.kind === "moon");
  const sun = frame.bodies.find((b) => b.kind === "sun");
  if (!moon || !sun) return null;
  const dLon = ((moon.eclLon - sun.eclLon) % 360 + 360) % 360;
  return {
    body: moon,
    illumination: moon.illumination ?? 0,
    waxing: dLon < 180,
    sign: zodiacSign(moon.eclLon),
    aboveHorizon: moon.alt > 0,
  };
}

export function bodiesAbove(frame: SkyFrame): FrameBody[] {
  return frame.bodies.filter((b) => b.alt > 0);
}

export function constellationsAbove(frame: SkyFrame): FrameConstellation[] {
  return frame.constellations.filter((c) => c.center.alt > 0);
}

export function isNight(frame: SkyFrame): boolean {
  const sun = frame.bodies.find((b) => b.kind === "sun");
  return !sun || sun.alt < -6 * DEG2RAD;
}
