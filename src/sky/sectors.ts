import { COMPASS_8, DEG2RAD, normalizeAz, type CompassPoint } from "@/sky/math";

export type Band = "zenith" | "high" | "low";

export type SkySector = {
  id: string;
  band: Band;
  compass?: CompassPoint;
  alt0: number;
  az0: number;
  fovDeg: number;
  altRange: [number, number];
};

export const ZENITH_ALT_DEG = 70;
export const BAND_SPLIT_ALT_DEG = 35;

export const SECTORS: SkySector[] = (() => {
  const list: SkySector[] = [
    {
      id: "zenith",
      band: "zenith",
      alt0: 89.5 * DEG2RAD,
      az0: 0,
      fovDeg: 40,
      altRange: [ZENITH_ALT_DEG, 90],
    },
  ];
  COMPASS_8.forEach((compass, i) => {
    const az0 = i * 45 * DEG2RAD;
    list.push({
      id: `high-${compass}`,
      band: "high",
      compass,
      alt0: ((ZENITH_ALT_DEG + BAND_SPLIT_ALT_DEG) / 2) * DEG2RAD,
      az0,
      fovDeg: 45,
      altRange: [BAND_SPLIT_ALT_DEG, ZENITH_ALT_DEG],
    });
    list.push({
      id: `low-${compass}`,
      band: "low",
      compass,
      alt0: (BAND_SPLIT_ALT_DEG / 2) * DEG2RAD,
      az0,
      fovDeg: 45,
      altRange: [0, BAND_SPLIT_ALT_DEG],
    });
  });
  return list;
})();

export function sectorAt(alt: number, az: number): SkySector | null {
  const altDeg = alt / DEG2RAD;
  if (altDeg < 0) return null;
  if (altDeg >= ZENITH_ALT_DEG) return SECTORS[0];
  const band: Band = altDeg >= BAND_SPLIT_ALT_DEG ? "high" : "low";
  const idx = Math.round(normalizeAz(az) / (45 * DEG2RAD)) % 8;
  return SECTORS.find((s) => s.band === band && s.compass === COMPASS_8[idx]) ?? null;
}
