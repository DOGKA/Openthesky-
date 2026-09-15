import { angularDistance, DEG2RAD } from "@/sky/math";
import type { Locale } from "@/i18n";
import type { SkyFrame } from "@/sky/frame";
import { BODY_LOCK_DEG, type CenteredObject } from "./types";

export function findCenteredObject(
  frame: SkyFrame,
  alt0: number,
  az0: number,
  fovDeg: number,
  locale: Locale
): CenteredObject | null {
  let bestBody: CenteredObject | null = null;
  let bestBodyD = BODY_LOCK_DEG * DEG2RAD;
  for (const b of frame.bodies) {
    if (b.alt < 0) continue;
    const d = angularDistance(b.alt, b.az, alt0, az0);
    if (d < bestBodyD) {
      bestBodyD = d;
      bestBody = {
        kind: b.kind,
        id: b.id,
        name: b.names[locale] || b.names.en,
        illumination: b.illumination,
      };
    }
  }
  if (bestBody) return bestBody;

  const limit = (fovDeg / 2) * DEG2RAD;
  let best: CenteredObject | null = null;
  let bestD = Infinity;
  for (const c of frame.constellations) {
    if (c.center.alt < 0) continue;
    const d = angularDistance(c.center.alt, c.center.az, alt0, az0);
    if (d < bestD && d < limit) {
      bestD = d;
      best = { kind: "constellation", id: c.id, name: c.names[locale] || c.names.en };
    }
  }
  return best;
}
