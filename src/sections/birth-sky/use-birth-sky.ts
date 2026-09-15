import { useMemo } from "react";
import { birthObserver, cityById, type BirthProfile, type Observer } from "@/lib/profiles";
import { useSkyFrame, type FrameBody, type FrameConstellation, type SkyFrame } from "@/lib/sky/use-sky-frame";
import {
  ageInYears,
  bodiesAbove,
  isNight,
  lightYearStar,
  moonFact,
  risingConstellation,
  zenithStar,
  type MoonFact,
  type StarFact,
} from "@/lib/sky/sky-insights";
import type { FrameStar } from "@/lib/sky/use-sky-frame";

export type BirthSkyFacts = {
  zenith: StarFact | null;
  zenithConstellation: FrameConstellation | null;
  rising: FrameConstellation | null;
  moon: MoonFact | null;
  planetsAbove: FrameBody[];
  night: boolean;
  ageYears: number;
  lightYear: FrameStar | null;
};

export function computeBirthFacts(frame: SkyFrame, birth: Date, at: Date = new Date()): BirthSkyFacts {
  const zenith = zenithStar(frame);
  const ageYears = ageInYears(birth, at);
  return {
    zenith,
    zenithConstellation: zenith?.constellationId
      ? frame.constellations.find((c) => c.id === zenith.constellationId) ?? null
      : null,
    rising: risingConstellation(frame),
    moon: moonFact(frame),
    planetsAbove: bodiesAbove(frame).filter((b) => b.kind === "planet"),
    night: isNight(frame),
    ageYears,
    lightYear: lightYearStar(frame, ageYears),
  };
}

export function useBirthSky(profile: BirthProfile, label: string) {
  const observer = useMemo<Observer>(() => birthObserver(profile, label), [profile, label]);
  const city = cityById(profile.cityId);
  const frame = useSkyFrame(observer.latitude, observer.longitude, observer.date!);
  const facts = useMemo(
    () => (frame ? computeBirthFacts(frame, observer.date!) : null),
    [frame, observer]
  );
  return { observer, city, frame, facts };
}
