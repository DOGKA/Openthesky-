import { Skia } from "@shopify/react-native-skia";
import { angularDistance, DEG2RAD, FEATURE_MAG, focalScale, projectGnomonic } from "@/sky/math";
import type { SkyFrame } from "../frame";
import type { BucketPoints, SceneOptions, SkyScene, Viewport } from "./types";

const MIN_ALT_DEFAULT = -0.5 * DEG2RAD;

function emptyBuckets(): BucketPoints {
  return { 0: [], 1: [], 2: [], 3: [], 4: [] };
}

export function buildScene(frame: SkyFrame, vp: Viewport, opts: SceneOptions): SkyScene {
  const {
    magLimit,
    lines: wantLines = true,
    labelMaxRank = 2,
    horizon: wantHorizon = true,
    margin = 12,
    minAlt = MIN_ALT_DEFAULT,
  } = opts;

  const scale = vp.scale ?? focalScale(vp.fovDeg * DEG2RAD, vp.width);
  const sinAlt0 = Math.sin(vp.alt0);
  const cosAlt0 = Math.cos(vp.alt0);
  const left = vp.cx - vp.width / 2 - margin;
  const right = vp.cx + vp.width / 2 + margin;
  const top = vp.cy - vp.height / 2 - margin;
  const bottom = vp.cy + vp.height / 2 + margin;

  const toPx = (alt: number, az: number) => {
    const p = projectGnomonic(alt, az, vp.alt0, vp.az0, sinAlt0, cosAlt0);
    if (!p) return null;
    return { x: vp.cx + p.x * scale, y: vp.cy - p.y * scale };
  };
  const inside = (x: number, y: number) => x >= left && x <= right && y >= top && y <= bottom;

  const points = emptyBuckets();
  const featured: SkyScene["featured"] = [];
  const named: SkyScene["named"] = [];
  let visibleCount = 0;
  for (const s of frame.stars) {
    if (s.mag > magLimit) break;
    if (s.alt < minAlt) continue;
    const px = toPx(s.alt, s.az);
    if (!px || !inside(px.x, px.y)) continue;
    visibleCount++;
    if (s.mag < FEATURE_MAG) featured.push({ x: px.x, y: px.y, star: s });
    else points[s.bucket].push(px);
    if (s.name) named.push({ x: px.x, y: px.y, star: s });
  }

  const bodies: SkyScene["bodies"] = [];
  for (const b of frame.bodies) {
    if (b.alt < minAlt) continue;
    const px = toPx(b.alt, b.az);
    if (!px || !inside(px.x, px.y)) continue;
    bodies.push({ x: px.x, y: px.y, body: b, dist: angularDistance(b.alt, b.az, vp.alt0, vp.az0) });
  }

  const linesPath = Skia.Path.Make();
  if (wantLines) {
    for (const c of frame.constellations) {
      for (const poly of c.lines) {
        let prev: { x: number; y: number } | null = null;
        for (const v of poly) {
          const px = v.alt < minAlt ? null : toPx(v.alt, v.az);
          if (px && prev && (inside(px.x, px.y) || inside(prev.x, prev.y))) {
            linesPath.moveTo(prev.x, prev.y);
            linesPath.lineTo(px.x, px.y);
          }
          prev = px;
        }
      }
    }
  }

  const labels: SkyScene["labels"] = [];
  for (const c of frame.constellations) {
    if (c.rank > labelMaxRank) continue;
    if (c.center.alt < minAlt) continue;
    const px = toPx(c.center.alt, c.center.az);
    if (!px || !inside(px.x, px.y)) continue;
    labels.push({
      x: px.x,
      y: px.y,
      constellation: c,
      dist: angularDistance(c.center.alt, c.center.az, vp.alt0, vp.az0),
    });
  }

  let horizonPath = null;
  if (wantHorizon) {
    const halfDiag = Math.atan((Math.hypot(vp.width, vp.height) / 2 + margin) / scale);
    if (vp.alt0 - halfDiag < 0.02) {
      horizonPath = Skia.Path.Make();
      let prev: { x: number; y: number } | null = null;
      const span = Math.min(Math.PI, halfDiag * 1.6 + 0.05);
      const steps = 64;
      for (let i = 0; i <= steps; i++) {
        const az = vp.az0 - span + (2 * span * i) / steps;
        const px = toPx(0, az);
        if (px && prev) {
          horizonPath.moveTo(prev.x, prev.y);
          horizonPath.lineTo(px.x, px.y);
        }
        prev = px;
      }
    }
  }

  return { scale, points, featured, named, visibleCount, lines: linesPath, horizon: horizonPath, labels, bodies };
}
