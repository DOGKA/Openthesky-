import { Circle, Group, Line, Points, vec } from "@shopify/react-native-skia";
import { SKY } from "@/theme";
import {
  BUCKET_OPACITY,
  BUCKET_SIZE,
  STAR_BUCKETS,
  starDisc,
  type StarBucket,
} from "@/sky/math";
import type { ProjectedStar } from "@/sky/scene";
import type { SkPoint } from "@shopify/react-native-skia";

export function StarField({
  points,
  featured,
  fovDeg,
}: {
  points: Record<StarBucket, SkPoint[]>;
  featured: ProjectedStar[];
  fovDeg: number;
}) {
  return (
    <Group>
      {STAR_BUCKETS.map((b) =>
        points[b].length ? (
          <Points
            key={b}
            points={points[b]}
            mode="points"
            style="stroke"
            strokeCap="round"
            strokeWidth={BUCKET_SIZE[b] * (fovDeg < 25 ? 0.95 : 0.8)}
            color={SKY.fg}
            opacity={BUCKET_OPACITY[b]}
          />
        ) : null
      )}
      {featured.map((s) => {
        const d = starDisc(s.star.mag, s.star.bv, s.star.ly, fovDeg);
        return (
          <Group key={`${s.star.ra}:${s.star.dec}`}>
            {d.glow > 0 ? <Circle cx={s.x} cy={s.y} r={d.glow} color={d.glowColor} /> : null}
            <Circle cx={s.x} cy={s.y} r={d.core} color={d.color} />
            {d.spike > 0 ? <DiffractionSpikes x={s.x} y={s.y} length={d.spike} color={d.color} /> : null}
          </Group>
        );
      })}
    </Group>
  );
}

function DiffractionSpikes({
  x,
  y,
  length,
  color,
}: {
  x: number;
  y: number;
  length: number;
  color: string;
}) {
  const t = 0.7;
  return (
    <Group>
      <Line p1={vec(x, y - length)} p2={vec(x, y - length * 0.35)} strokeWidth={t} color={color} />
      <Line p1={vec(x, y + length * 0.35)} p2={vec(x, y + length)} strokeWidth={t} color={color} />
      <Line p1={vec(x - length, y)} p2={vec(x - length * 0.35, y)} strokeWidth={t} color={color} />
      <Line p1={vec(x + length * 0.35, y)} p2={vec(x + length, y)} strokeWidth={t} color={color} />
    </Group>
  );
}
