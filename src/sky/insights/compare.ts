import { DEG2RAD, RAD2DEG } from "@/sky/math";
import type { FrameBody, FrameConstellation, SkyFrame } from "@/sky/frame";
import { bodiesAbove, constellationsAbove, moonFact, type MoonFact } from "./moon";
import { risingConstellation, zenithStar, type StarFact } from "./stars";

export type SkyComparison = {
  sharedConstellations: FrameConstellation[];
  onlyA: FrameConstellation[];
  onlyB: FrameConstellation[];
  overlap: number;
  sharedPlanets: FrameBody[];
  zenithA: StarFact | null;
  zenithB: StarFact | null;
  zenithSeparationDeg: number | null;
  risingA: FrameConstellation | null;
  risingB: FrameConstellation | null;
  sameRising: boolean;
  moonA: MoonFact | null;
  moonB: MoonFact | null;
  moonIlluminationDiff: number | null;
  sameMoonSign: boolean;
};

export function compareSkies(a: SkyFrame, b: SkyFrame): SkyComparison {
  const ids = (f: SkyFrame) => new Set(constellationsAbove(f).map((c) => c.id));
  const setA = ids(a);
  const setB = ids(b);
  const shared = [...setA].filter((id) => setB.has(id));
  const union = new Set([...setA, ...setB]);
  const byId = (f: SkyFrame, id: string) => f.constellations.find((c) => c.id === id)!;
  const planetsA = new Set(bodiesAbove(a).filter((x) => x.kind === "planet").map((x) => x.id));
  const zenithA = zenithStar(a);
  const zenithB = zenithStar(b);

  let zenithSeparationDeg: number | null = null;
  if (zenithA && zenithB) {
    const ra1 = zenithA.star.ra * DEG2RAD;
    const de1 = zenithA.star.dec * DEG2RAD;
    const ra2 = zenithB.star.ra * DEG2RAD;
    const de2 = zenithB.star.dec * DEG2RAD;
    const c =
      Math.sin(de1) * Math.sin(de2) + Math.cos(de1) * Math.cos(de2) * Math.cos(ra1 - ra2);
    zenithSeparationDeg = Math.acos(Math.max(-1, Math.min(1, c))) * RAD2DEG;
  }

  const risingA = risingConstellation(a);
  const risingB = risingConstellation(b);
  const moonA = moonFact(a);
  const moonB = moonFact(b);

  return {
    sharedConstellations: shared.map((id) => byId(a, id)),
    onlyA: [...setA].filter((id) => !setB.has(id)).map((id) => byId(a, id)),
    onlyB: [...setB].filter((id) => !setA.has(id)).map((id) => byId(b, id)),
    overlap: union.size ? shared.length / union.size : 0,
    sharedPlanets: bodiesAbove(b).filter((x) => x.kind === "planet" && planetsA.has(x.id)),
    zenithA,
    zenithB,
    zenithSeparationDeg,
    risingA,
    risingB,
    sameRising: !!risingA && !!risingB && risingA.id === risingB.id,
    moonA,
    moonB,
    moonIlluminationDiff: moonA && moonB ? Math.abs(moonA.illumination - moonB.illumination) : null,
    sameMoonSign: !!moonA && !!moonB && moonA.sign === moonB.sign,
  };
}
