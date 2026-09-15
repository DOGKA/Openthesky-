import { useMemo } from "react";
import {
  Circle,
  Group,
  Line,
  Path,
  Points,
  Text as SkText,
  vec,
  type SkFont,
  type SkPath,
} from "@shopify/react-native-skia";
import { SKY } from "@/theme";
import { makeAstrolicPath } from "@/astrolic-mark";
import type { SkyFrame } from "@/sky/frame";
import { BUCKET_OPACITY, BUCKET_SIZE, COMPASS_8, DEG2RAD, STAR_BUCKETS, starDisc } from "@/sky/math";
import { BAND_SPLIT_ALT_DEG, ZENITH_ALT_DEG } from "@/sky/sectors";
import { AimMark } from "./aim-mark";
import { radarRadiusForAlt, type RadarGeometry } from "./geometry";
import { useRadarScene } from "./use-radar-scene";

type Props = RadarGeometry & {
  frame: SkyFrame;
  magLimit?: number;
  grid?: boolean;
  compassFont?: SkFont | null;
  scale?: number;
  highlight?: SkPath | null;
  zenithMark?: boolean;
  aim?: { alt: number; az: number } | null;
};

export function OpenSkyRadarGraphic({
  frame,
  cx,
  cy,
  R,
  magLimit = 4.5,
  grid = true,
  compassFont = null,
  scale = 1,
  highlight = null,
  zenithMark = true,
  aim = null,
}: Props) {
  const g: RadarGeometry = { cx, cy, R };
  const rZenith = radarRadiusForAlt(ZENITH_ALT_DEG, R);
  const rSplit = radarRadiusForAlt(BAND_SPLIT_ALT_DEG, R);
  const scene = useRadarScene(frame, g, magLimit);
  const mark = useMemo(() => makeAstrolicPath(cx, cy, 12 * scale), [cx, cy, scale]);

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={R} color={SKY.fg06} />
      {highlight ? <Path path={highlight} color={SKY.fg12} /> : null}
      <Path path={scene.lines} style="stroke" strokeWidth={0.6 * scale} color="rgba(180,200,255,0.16)" />
      {STAR_BUCKETS.map((b) =>
        scene.points[b].length ? (
          <Points
            key={b}
            points={scene.points[b]}
            mode="points"
            style="stroke"
            strokeCap="round"
            strokeWidth={BUCKET_SIZE[b] * 0.75 * scale}
            color={SKY.fg}
            opacity={BUCKET_OPACITY[b]}
          />
        ) : null
      )}
      {scene.featured.map((s, i) => {
        const d = starDisc(s.mag, s.bv, s.ly, 36);
        return (
          <Group key={i}>
            {d.glow > 0 ? (
              <Circle cx={s.x} cy={s.y} r={d.glow * 0.45 * scale} color={d.glowColor} />
            ) : null}
            <Circle cx={s.x} cy={s.y} r={Math.max(0.8, d.core * 0.55) * scale} color={d.color} />
          </Group>
        );
      })}
      {scene.bodies.map((b) => (
        <Circle
          key={b.id}
          cx={b.x}
          cy={b.y}
          r={(b.kind === "planet" ? 3 : 4) * scale}
          style="stroke"
          strokeWidth={0.9 * scale}
          color={SKY.fg70}
        />
      ))}
      <Circle cx={cx} cy={cy} r={R} style="stroke" strokeWidth={1 * scale} color={SKY.fg22} />
      {grid ? (
        <>
          <Circle cx={cx} cy={cy} r={rSplit} style="stroke" strokeWidth={0.8 * scale} color={SKY.fg12} />
          <Circle cx={cx} cy={cy} r={rZenith} style="stroke" strokeWidth={0.8 * scale} color={SKY.fg12} />
          {scene.wedges.map((l, i) => (
            <Line key={i} p1={vec(l.p1.x, l.p1.y)} p2={vec(l.p2.x, l.p2.y)} strokeWidth={0.8 * scale} color={SKY.fg12} />
          ))}
        </>
      ) : null}
      {zenithMark ? (
        <Path path={mark} style="stroke" strokeWidth={0.8 * scale} strokeJoin="round" color={SKY.fg50} />
      ) : null}
      {aim ? <AimMark cx={cx} cy={cy} R={R} alt={aim.alt} az={aim.az} scale={scale} /> : null}
      {compassFont
        ? COMPASS_8.map((label, i) => {
            const az = i * 45 * DEG2RAD;
            const rr = R + 16 * scale;
            const x = cx - rr * Math.sin(az);
            const y = cy - rr * Math.cos(az);
            return (
              <SkText
                key={label}
                x={x - compassFont.getTextWidth(label) / 2}
                y={y + compassFont.getSize() * 0.35}
                text={label}
                font={compassFont}
                color={i % 2 === 0 ? SKY.fg70 : SKY.fg35}
              />
            );
          })
        : null}
    </Group>
  );
}

export { radarProject, radarRadiusForAlt } from "./geometry";
export type { RadarGeometry } from "./geometry";
