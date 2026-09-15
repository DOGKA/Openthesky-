import { useMemo } from "react";
import { Skia } from "@shopify/react-native-skia";
import { DEG2RAD, type StarBucket } from "@/sky/math";
import type { SkyFrame } from "@/sky/frame";
import { radarProject, radarRadiusForAlt, type RadarGeometry } from "./geometry";
import { BAND_SPLIT_ALT_DEG, ZENITH_ALT_DEG } from "@/sky/sectors";

export function useRadarScene(frame: SkyFrame, g: RadarGeometry, magLimit: number) {
  const { cx, cy, R } = g;
  const rZenith = radarRadiusForAlt(ZENITH_ALT_DEG, R);

  return useMemo(() => {
    const points: Record<StarBucket, { x: number; y: number }[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
    };
    const featured: { x: number; y: number; mag: number; bv: number; ly: number }[] = [];
    for (const s of frame.stars) {
      if (s.mag > magLimit) break;
      if (s.alt <= 0) continue;
      const p = radarProject(s.alt, s.az, g);
      if (s.mag < 2.8) featured.push({ ...p, mag: s.mag, bv: s.bv, ly: s.ly });
      else points[s.bucket].push(p);
    }

    const lines = Skia.Path.Make();
    for (const c of frame.constellations) {
      for (const poly of c.lines) {
        let prev: { x: number; y: number } | null = null;
        for (const v of poly) {
          if (v.alt <= 0) {
            prev = null;
            continue;
          }
          const p = radarProject(v.alt, v.az, g);
          if (prev) {
            lines.moveTo(prev.x, prev.y);
            lines.lineTo(p.x, p.y);
          }
          prev = p;
        }
      }
    }

    const bodies = frame.bodies
      .filter((b) => b.alt > 0)
      .map((b) => ({ id: b.id, kind: b.kind, ...radarProject(b.alt, b.az, g) }));

    const wedges: { p1: { x: number; y: number }; p2: { x: number; y: number } }[] = [];
    for (let k = 0; k < 8; k++) {
      const az = (22.5 + k * 45) * DEG2RAD;
      const s = Math.sin(az);
      const c = Math.cos(az);
      wedges.push({
        p1: { x: cx - rZenith * s, y: cy - rZenith * c },
        p2: { x: cx - R * s, y: cy - R * c },
      });
    }

    return { points, featured, lines, bodies, wedges };
  }, [frame, magLimit, cx, cy, R, rZenith]);
}
