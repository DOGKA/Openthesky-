export type StarBucket = 0 | 1 | 2 | 3 | 4;

export const STAR_BUCKETS: StarBucket[] = [0, 1, 2, 3, 4];

export function starBucket(mag: number): StarBucket {
  if (mag < 1.0) return 0;
  if (mag < 2.2) return 1;
  if (mag < 3.4) return 2;
  if (mag < 4.6) return 3;
  return 4;
}

export const BUCKET_SIZE: Record<StarBucket, number> = {
  0: 6.6,
  1: 4.6,
  2: 3.2,
  3: 2.2,
  4: 1.4,
};

export const BUCKET_OPACITY: Record<StarBucket, number> = {
  0: 1,
  1: 1,
  2: 0.92,
  3: 0.78,
  4: 0.55,
};

export function starColor(bv: number): string {
  if (bv < 0.0) return "#9ec5ff";
  if (bv < 0.35) return "#d0e4ff";
  if (bv < 0.65) return "#f4f7ff";
  if (bv < 1.05) return "#fff1d4";
  if (bv < 1.55) return "#ffd39a";
  return "#ffb56a";
}
