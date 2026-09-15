import { useMemo } from "react";
import { computeSkyFrame, type SkyFrame } from "./frame";

export function useSkyFrame(
  latitude: number | null,
  longitude: number | null,
  date: Date
): SkyFrame | null {
  const minute = Math.floor(date.getTime() / 60000);
  return useMemo(() => {
    if (latitude == null || longitude == null) return null;
    return computeSkyFrame(latitude, longitude, new Date(minute * 60000));
  }, [latitude, longitude, minute]);
}

export type { FrameBody, FrameConstellation, FrameStar, SkyFrame } from "./frame";
