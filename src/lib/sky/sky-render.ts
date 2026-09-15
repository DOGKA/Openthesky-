/**
 * Projects a SkyFrame onto a rectangular viewport and groups the result into a
 * handful of Skia-friendly batches (one <Points> per magnitude bucket instead
 * of thousands of <Circle>s).
 */
import { Skia, type SkPath, type SkPoint } from "@shopify/react-native-skia";
import type {
  FrameBody,
  FrameConstellation,
  FrameStar,
  SkyFrame,
} from "./use-sky-frame";
import {
  DEG2RAD,
  STAR_BUCKETS,
  focalScale,
  projectGnomonic,
  type StarBucket,
} from "./sky-math";

export type Viewport = {
  /** centre of the viewport in px */
  cx: number;
  cy: number;
  width: number;
  height: number;
  /** viewing direction */
  alt0: number;
  az0: number;
  /** horizontal field of view in degrees; the px scale derives from it */
  fovDeg: number;
  /** if given, `scale` overrides the one derived from fovDeg */
  scale?: number;
};

export type BucketPoints = Record<StarBucket, SkPoint[]>;

export type ProjectedStar = {
  x: number;
  y: number;
  star: FrameStar;
};

export type ProjectedLabel = {
  x: number;
  y: number;
  constellation: FrameConstellation;
  /** angular distance from the viewing direction, radians */
  dist: number;
};

export type ProjectedBody = {
  x: number;
  y: number;
  body: FrameBody;
  /** angular distance from the viewing direction, radians */
  dist: number;
};

export type SkyScene = {
  scale: number;
  points: BucketPoints;
  /** stars with a proper name inside the viewport */
  named: ProjectedStar[];
  visibleCount: number;
  lines: SkPath;
  horizon: SkPath | null;
  labels: ProjectedLabel[];
  /** Sun, Moon, planets inside the viewport */
  bodies: ProjectedBody[];
};

export type SceneOptions = {
  magLimit: number;
  /** include constellation lines */
  lines?: boolean;
  /** include constellation labels; ranks above this are skipped */
  labelMaxRank?: number;
  /** include the horizon line */
  horizon?: boolean;
  /** how far (px) outside the viewport we still keep points, for clipping */
  margin?: number;
  /** minimum altitude (radians) for a star to count as visible */
  minAlt?: number;
};

const MIN_ALT_DEFAULT = -0.5 * DEG2RAD;

function emptyBuckets(): BucketPoints {
  return { 0: [], 1: [], 2: [], 3: [], 4: [] };
}

export function buildScene(
  frame: SkyFrame,
  vp: Viewport,
  opts: SceneOptions
): SkyScene {
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
  const inside = (x: number, y: number) =>
    x >= left && x <= right && y >= top && y <= bottom;

  // ---- stars -------------------------------------------------------------
  const points = emptyBuckets();
  const named: ProjectedStar[] = [];
  let visibleCount = 0;

  const stars = frame.stars;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    if (s.mag > magLimit) break; // sorted by magnitude
    if (s.alt < minAlt) continue;
    const px = toPx(s.alt, s.az);
    if (!px || !inside(px.x, px.y)) continue;
    visibleCount++;
    points[s.bucket].push(px);
    if (s.name) named.push({ x: px.x, y: px.y, star: s });
  }

  // ---- Sun, Moon, planets ---------------------------------------------------
  const bodies: ProjectedBody[] = [];
  for (const b of frame.bodies) {
    if (b.alt < minAlt) continue;
    const px = toPx(b.alt, b.az);
    if (!px || !inside(px.x, px.y)) continue;
    bodies.push({
      x: px.x,
      y: px.y,
      body: b,
      dist: angularDistance(b.alt, b.az, vp.alt0, vp.az0),
    });
  }

  // ---- constellation lines ----------------------------------------------
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

  // ---- labels ------------------------------------------------------------
  const labels: ProjectedLabel[] = [];
  for (const c of frame.constellations) {
    if (c.rank > labelMaxRank) continue;
    if (c.center.alt < minAlt) continue;
    const px = toPx(c.center.alt, c.center.az);
    if (!px || !inside(px.x, px.y)) continue;
    const dist = angularDistance(c.center.alt, c.center.az, vp.alt0, vp.az0);
    labels.push({ x: px.x, y: px.y, constellation: c, dist });
  }

  // ---- horizon -----------------------------------------------------------
  let horizonPath: SkPath | null = null;
  if (wantHorizon) {
    // Only bother when the horizon can plausibly be in view.
    const halfDiag = Math.atan(
      (Math.hypot(vp.width, vp.height) / 2 + margin) / scale
    );
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

  return {
    scale,
    points,
    named,
    visibleCount,
    lines: linesPath,
    horizon: horizonPath,
    labels,
    bodies,
  };
}

export function angularDistance(
  alt1: number,
  az1: number,
  alt2: number,
  az2: number
): number {
  const c =
    Math.sin(alt1) * Math.sin(alt2) +
    Math.cos(alt1) * Math.cos(alt2) * Math.cos(az1 - az2);
  return Math.acos(Math.max(-1, Math.min(1, c)));
}

export { STAR_BUCKETS };
