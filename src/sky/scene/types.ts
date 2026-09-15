import type { SkPath, SkPoint } from "@shopify/react-native-skia";
import type { StarBucket } from "@/sky/math";
import type { FrameBody, FrameConstellation, FrameStar } from "../frame";

export type Viewport = {
  cx: number;
  cy: number;
  width: number;
  height: number;
  alt0: number;
  az0: number;
  fovDeg: number;
  scale?: number;
};

export type BucketPoints = Record<StarBucket, SkPoint[]>;

export type ProjectedStar = { x: number; y: number; star: FrameStar };
export type ProjectedLabel = {
  x: number;
  y: number;
  constellation: FrameConstellation;
  dist: number;
};
export type ProjectedBody = { x: number; y: number; body: FrameBody; dist: number };

export type SkyScene = {
  scale: number;
  points: BucketPoints;
  /** mag < FEATURE_MAG — drawn as coloured discs */
  featured: ProjectedStar[];
  named: ProjectedStar[];
  visibleCount: number;
  lines: SkPath;
  horizon: SkPath | null;
  labels: ProjectedLabel[];
  bodies: ProjectedBody[];
};

export type SceneOptions = {
  magLimit: number;
  lines?: boolean;
  labelMaxRank?: number;
  horizon?: boolean;
  margin?: number;
  minAlt?: number;
};
