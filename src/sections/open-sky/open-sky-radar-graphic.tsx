import { useMemo } from "react";
import {
  Circle,
  Group,
  Line,
  Path,
  Points,
  Skia,
  Text as SkText,
  vec,
  type SkFont,
} from "@shopify/react-native-skia";
import { SKY } from "@/lib/theme";
import { makeAstrolicPath } from "@/lib/astrolic-mark";
import type { SkyFrame } from "@/lib/sky/use-sky-frame";
import {
  BUCKET_OPACITY,
  BUCKET_SIZE,
  COMPASS_8,
  DEG2RAD,
  STAR_BUCKETS,
  type StarBucket,
} from "@/lib/sky/sky-math";
import { BAND_SPLIT_ALT_DEG, ZENITH_ALT_DEG } from "@/lib/sky/sky-sectors";

const HALF_PI = Math.PI / 2;

export type RadarGeometry = {
  cx: number;
  cy: number;
  /** horizon radius in px */
  R: number;
};

/** Azimuthal-equidistant projection used by the all-sky view. */
export function radarProject(alt: number, az: number, g: RadarGeometry) {
  const r = ((HALF_PI - alt) / HALF_PI) * g.R;
  return { x: g.cx - r * Math.sin(az), y: g.cy - r * Math.cos(az) };
}

export function radarRadiusForAlt(altDeg: number, R: number) {
  return (1 - altDeg / 90) * R;
}

type Props = RadarGeometry & {
  frame: SkyFrame;
  magLimit?: number;
  /** draw the sector grid (rings + wedges) */
  grid?: boolean;
  /** draw the 8 compass labels with this Skia font (omit for RN labels) */
  compassFont?: SkFont | null;
  /** overall scale for dot sizes / stroke widths (poster uses > 1) */
  scale?: number;
  /** highlighted sector path, if any */
  highlight?: ReturnType<typeof Skia.Path.Make> | null;
  /** mark the zenith with the Astrolic star */
  zenithMark?: boolean;
  /** current look direction (live mode) */
  aim?: { alt: number; az: number } | null;
};

/**
 * Pure-Skia all-sky drawing: stars, constellation lines, bodies and the
 * sector grid. No touch handling, no RN views, so it can be rendered
 * on-screen, in a small card, or offscreen for the story poster.
 */
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

  const scene = useMemo(() => {
    const points: Record<StarBucket, { x: number; y: number }[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
    };
    for (const s of frame.stars) {
      if (s.mag > magLimit) break;
      if (s.alt <= 0) continue;
      points[s.bucket].push(radarProject(s.alt, s.az, g));
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

    return { points, lines, bodies, wedges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, magLimit, cx, cy, R, rZenith]);

  const mark = useMemo(
    () => makeAstrolicPath(cx, cy, 12 * scale),
    [cx, cy, scale]
  );

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={R} color={SKY.fg06} />
      {highlight ? <Path path={highlight} color={SKY.fg12} /> : null}

      <Path
        path={scene.lines}
        style="stroke"
        strokeWidth={0.6 * scale}
        color="rgba(180,200,255,0.16)"
      />

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
            <Line
              key={i}
              p1={vec(l.p1.x, l.p1.y)}
              p2={vec(l.p2.x, l.p2.y)}
              strokeWidth={0.8 * scale}
              color={SKY.fg12}
            />
          ))}
        </>
      ) : null}

      {zenithMark ? (
        <Path path={mark} style="stroke" strokeWidth={0.8 * scale} strokeJoin="round" color={SKY.fg50} />
      ) : null}

      {aim ? (
        <AimMark cx={cx} cy={cy} R={R} alt={aim.alt} az={aim.az} scale={scale} />
      ) : null}

      {compassFont
        ? COMPASS_8.map((label, i) => {
            const az = i * 45 * DEG2RAD;
            const rr = R + 16 * scale;
            const x = cx - rr * Math.sin(az);
            const y = cy - rr * Math.cos(az);
            const w = compassFont.getTextWidth(label);
            return (
              <SkText
                key={label}
                x={x - w / 2}
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

function AimMark({
  cx,
  cy,
  R,
  alt,
  az,
  scale,
}: {
  cx: number;
  cy: number;
  R: number;
  alt: number;
  az: number;
  scale: number;
}) {
  const g = { cx, cy, R };
  const p =
    alt > 0
      ? radarProject(alt, az, g)
      : { x: cx - R * Math.sin(az), y: cy - R * Math.cos(az) };
  const rim = { x: cx - (R + 6 * scale) * Math.sin(az), y: cy - (R + 6 * scale) * Math.cos(az) };
  const rimIn = { x: cx - (R - 4 * scale) * Math.sin(az), y: cy - (R - 4 * scale) * Math.cos(az) };
  return (
    <Group>
      <Line
        p1={vec(rimIn.x, rimIn.y)}
        p2={vec(rim.x, rim.y)}
        strokeWidth={1.4 * scale}
        color={SKY.accent}
      />
      {alt > 0 ? (
        <Circle cx={p.x} cy={p.y} r={4 * scale} style="stroke" strokeWidth={1.2 * scale} color={SKY.accent} />
      ) : null}
    </Group>
  );
}
