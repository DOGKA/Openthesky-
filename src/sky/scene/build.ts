import { Skia } from "@shopify/react-native-skia";
import {
  angularDistance,
  DEG2RAD,
  FEATURE_MAG,
  focalScale,
  type HorizontalVec,
} from "@/sky/math";
import type { SkyFrame } from "../frame";
import type { BucketPoints, SceneOptions, SkyScene, Viewport } from "./types";

const MIN_ALT_DEFAULT = -0.5 * DEG2RAD;
/** Points closer than this to the tangent plane horizon are behind the camera. */
const MIN_COS = 0.08;

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
  const sinAz0 = Math.sin(vp.az0);
  const cosAz0 = Math.cos(vp.az0);
  const left = vp.cx - vp.width / 2 - margin;
  const right = vp.cx + vp.width / 2 + margin;
  const top = vp.cy - vp.height / 2 - margin;
  const bottom = vp.cy + vp.height / 2 + margin;

  // Camera basis at (alt0, az0): w points at the screen centre, e to the
  // left edge, n up. Projecting is then three dot products, no trigonometry.
  const wx = cosAlt0 * cosAz0;
  const wy = cosAlt0 * sinAz0;
  const wz = sinAlt0;
  const ex = -sinAz0;
  const ey = cosAz0;
  const nx = -sinAlt0 * cosAz0;
  const ny = -sinAlt0 * sinAz0;
  const nz = cosAlt0;

  // Anything further off-axis than the screen diagonal cannot be visible, so a
  // single dot product rejects it before we divide. At full zoom this throws
  // away ~99% of the catalogue.
  const halfDiag = Math.atan((Math.hypot(vp.width, vp.height) / 2 + margin) / scale);
  const cosCull = Math.max(Math.cos(Math.min(halfDiag * 1.05 + 0.02, 1.5)), MIN_COS);

  const project = (vx: number, vy: number, vz: number) => {
    const c = vx * wx + vy * wy + vz * wz;
    if (c <= MIN_COS) return null;
    return {
      x: vp.cx - ((vx * ex + vy * ey) / c) * scale,
      y: vp.cy - ((vx * nx + vy * ny + vz * nz) / c) * scale,
    };
  };
  const toPx = (p: HorizontalVec) => project(p.vx, p.vy, p.vz);
  const inside = (x: number, y: number) => x >= left && x <= right && y >= top && y <= bottom;
  // The margin exists so a drag has something to reveal; the star count in the
  // HUD should still mean "on screen".
  const onScreen = (x: number, y: number) =>
    x >= left + margin && x <= right - margin && y >= top + margin && y <= bottom - margin;

  const points = emptyBuckets();
  const featured: SkyScene["featured"] = [];
  const named: SkyScene["named"] = [];
  let visibleCount = 0;
  for (const s of frame.stars) {
    if (s.mag > magLimit) break;
    if (s.alt < minAlt) continue;
    if (s.vx * wx + s.vy * wy + s.vz * wz < cosCull) continue;
    const px = project(s.vx, s.vy, s.vz);
    if (!px || !inside(px.x, px.y)) continue;
    if (onScreen(px.x, px.y)) visibleCount++;
    if (s.mag < FEATURE_MAG) featured.push({ x: px.x, y: px.y, star: s });
    else points[s.bucket].push(px);
    if (s.name) named.push({ x: px.x, y: px.y, star: s });
  }

  const bodies: SkyScene["bodies"] = [];
  for (const b of frame.bodies) {
    if (b.alt < minAlt) continue;
    const px = toPx(b);
    if (!px || !inside(px.x, px.y)) continue;
    bodies.push({ x: px.x, y: px.y, body: b, dist: angularDistance(b.alt, b.az, vp.alt0, vp.az0) });
  }

  const linesPath = Skia.Path.Make();
  if (wantLines) {
    for (const c of frame.constellations) {
      for (const poly of c.lines) {
        let prev: { x: number; y: number } | null = null;
        for (const v of poly) {
          const px = v.alt < minAlt ? null : toPx(v);
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
    const px = toPx(c.center);
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
    if (vp.alt0 - halfDiag < 0.02) {
      horizonPath = Skia.Path.Make();
      let prev: { x: number; y: number } | null = null;
      const span = Math.min(Math.PI, halfDiag * 1.6 + 0.05);
      const steps = 64;
      for (let i = 0; i <= steps; i++) {
        const az = vp.az0 - span + (2 * span * i) / steps;
        const px = project(Math.cos(az), Math.sin(az), 0);
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
