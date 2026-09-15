import { useMemo } from "react";
import {
  Canvas,
  Circle,
  Group,
  Line,
  Oval,
  Path,
  Points,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { SKY } from "@/theme";
import type { BodyKind } from "@/sky/ephemeris";
import { constellationFigure } from "@/sky/figure";

/** A single constellation's stick figure, for spots outside the grid. */
export function ConstellationGlyph({ id, size = 30 }: { id: string; size?: number }) {
  const figure = useMemo(() => constellationFigure(id, size), [id, size]);
  if (!figure) return null;
  return (
    <Canvas pointerEvents="none" style={{ width: size, height: size }}>
      <Path path={figure.path} style="stroke" strokeWidth={0.8} color={SKY.constellationLine} />
      <Points
        points={figure.stars}
        mode="points"
        style="stroke"
        strokeCap="round"
        strokeWidth={1.8}
        color={SKY.fg70}
      />
    </Canvas>
  );
}

/** Disc radius as a fraction of the box, per body, so Jupiter reads bigger than Mercury. */
const DISC: Record<string, number> = {
  sol: 0.3,
  lun: 0.3,
  mer: 0.17,
  ven: 0.24,
  mar: 0.2,
  jup: 0.29,
  sat: 0.24,
};

/**
 * Drawn marks rather than emoji or a symbol font: a rayed disc for the Sun, a
 * real crescent for the Moon, a banded disc for Jupiter, a ringed one for
 * Saturn, plain discs elsewhere.
 */
export function BodyGlyph({
  id,
  kind,
  illumination,
  waning = false,
  size = 22,
  color = SKY.fg70,
}: {
  id: string;
  kind: BodyKind;
  illumination?: number;
  /** Mirrors the crescent: lit on the left once the Moon is past full. */
  waning?: boolean;
  size?: number;
  color?: string;
}) {
  const c = size / 2;
  const r = size * (DISC[id] ?? 0.22);
  const rays = useMemo(() => (kind === "sun" ? rayPath(c, r, size) : null), [kind, c, r, size]);

  return (
    <Canvas pointerEvents="none" style={{ width: size, height: size }}>
      {kind === "moon" ? (
        <Group>
          <Circle cx={c} cy={c} r={r} color={color} />
          {/* Shadow disc slid across the lit one: no offset hides it all (new
              moon), a full diameter clears it (full moon). */}
          <Circle
            cx={c + (waning ? 1 : -1) * 2 * r * clamp01(illumination ?? 0.5)}
            cy={c}
            r={r}
            color={SKY.bg}
          />
          <Circle cx={c} cy={c} r={r} style="stroke" strokeWidth={0.6} color={SKY.fg35} />
        </Group>
      ) : (
        <Group>
          {rays ? <Path path={rays} style="stroke" strokeWidth={0.8} color={color} /> : null}
          <Circle cx={c} cy={c} r={r} color={color} />
          {id === "jup" ? (
            <Group>
              <Line
                p1={vec(c - r * 0.85, c - r * 0.35)}
                p2={vec(c + r * 0.85, c - r * 0.35)}
                strokeWidth={0.7}
                color={SKY.bg}
              />
              <Line
                p1={vec(c - r * 0.85, c + r * 0.35)}
                p2={vec(c + r * 0.85, c + r * 0.35)}
                strokeWidth={0.7}
                color={SKY.bg}
              />
            </Group>
          ) : null}
          {id === "sat" ? (
            <Oval
              x={c - r * 1.9}
              y={c - r * 0.5}
              width={r * 3.8}
              height={r}
              style="stroke"
              strokeWidth={0.8}
              color={color}
            />
          ) : null}
        </Group>
      )}
    </Canvas>
  );
}

/**
 * One mark that says "zodiac": the ecliptic seen edge on, divided into signs,
 * with the body's station marked. Deliberately not a crescent or a sign symbol.
 */
export function ZodiacMark({ size = 22, color = SKY.fg50 }: { size?: number; color?: string }) {
  const ticks = useMemo(() => {
    const path = Skia.Path.Make();
    const cx = size / 2;
    const cy = size / 2;
    const rx = size * 0.44;
    const ry = size * 0.2;
    // twelve signs as short ticks across the band
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const x = Math.cos(a);
      const y = Math.sin(a);
      path.moveTo(cx + x * rx * 0.75, cy + y * ry * 0.75);
      path.lineTo(cx + x * rx * 1.25, cy + y * ry * 1.25);
    }
    return path;
  }, [size]);

  return (
    <Canvas pointerEvents="none" style={{ width: size, height: size }}>
      <Oval
        x={size * 0.06}
        y={size * 0.3}
        width={size * 0.88}
        height={size * 0.4}
        style="stroke"
        strokeWidth={0.8}
        color={color}
      />
      <Path path={ticks} style="stroke" strokeWidth={0.4} color={SKY.fg22} />
      <Circle cx={size * 0.78} cy={size * 0.36} r={1.7} color={SKY.fg70} />
    </Canvas>
  );
}

function rayPath(c: number, r: number, size: number) {
  const path = Skia.Path.Make();
  const inner = r * 1.5;
  const outer = size / 2 - 1;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    path.moveTo(c + dx * inner, c + dy * inner);
    path.lineTo(c + dx * outer, c + dy * outer);
  }
  return path;
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
