import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Path,
  Points,
  RadialGradient,
  Rect,
  Text as SkText,
  useFont,
  vec,
  type SkFont,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { GeistMono_400Regular } from "@expo-google-fonts/geist-mono";
import { SKY } from "@/lib/theme";
import { makeAstrolicPath } from "@/lib/astrolic-mark";
import type { SkyFrame } from "@/lib/sky/use-sky-frame";
import {
  buildScene,
  angularDistance,
  type ProjectedBody,
} from "@/lib/sky/sky-render";
import {
  BUCKET_OPACITY,
  BUCKET_SIZE,
  DEG2RAD,
  STAR_BUCKETS,
  clamp,
  focalScale,
  magLimitForFov,
  normalizeAz,
} from "@/lib/sky/sky-math";
import type { SkySector } from "@/lib/sky/sky-sectors";
import type { SkyLocale } from "@/lib/sky/sky-data";

export type TelescopeState = {
  alt0: number;
  az0: number;
  fovDeg: number;
};

export type CenteredObject = {
  kind: "constellation" | "sun" | "moon" | "planet";
  id: string;
  name: string;
  /** Moon only */
  illumination?: number;
};

export type TelescopeReadout = TelescopeState & {
  magLimit: number;
  visibleCount: number;
  /** body within ~3° of the reticle, else the nearest constellation in view */
  centered: CenteredObject | null;
};

type Props = {
  frame: SkyFrame;
  sector: SkySector;
  width: number;
  height: number;
  locale: SkyLocale;
  onReadout?: (r: TelescopeReadout) => void;
  /** follow the phone's rear camera */
  live?: boolean;
  look?: { alt: number; az: number } | null;
};

const FOV_MIN = 10;
const FOV_MAX = 70;
const ALT_MIN = -6 * DEG2RAD;
const ALT_MAX = 89.5 * DEG2RAD;
const NAME_FOV_MAX = 40; // star names appear below this field of view
/** Astrolic mark size (px) used as the reticle */
const RETICLE_SIZE = 64;
/** a body this close to the reticle (degrees) wins over the constellation */
const BODY_LOCK_DEG = 3;

export function OpenSkyTelescope({
  frame,
  sector,
  width,
  height,
  locale,
  onReadout,
  live = false,
  look = null,
}: Props) {
  const [view, setView] = useState<TelescopeState>({
    alt0: sector.alt0,
    az0: sector.az0,
    fovDeg: sector.fovDeg,
  });
  const startRef = useRef<TelescopeState>(view);

  const labelFont = useFont(GeistMono_400Regular, 10);
  const nameFont = useFont(GeistMono_400Regular, 9);

  const cx = width / 2;
  const cy = height / 2;
  const magLimit = magLimitForFov(view.fovDeg);

  const scene = useMemo(
    () =>
      buildScene(
        frame,
        {
          cx,
          cy,
          width,
          height,
          alt0: view.alt0,
          az0: view.az0,
          fovDeg: view.fovDeg,
        },
        { magLimit, labelMaxRank: 2, horizon: true, lines: true }
      ),
    [frame, cx, cy, width, height, view.alt0, view.az0, view.fovDeg, magLimit]
  );

  // Object under the reticle, for the HUD: a body within BODY_LOCK_DEG wins,
  // otherwise the nearest constellation (any rank) inside the view.
  const centered = useMemo<CenteredObject | null>(() => {
    let bestBody: CenteredObject | null = null;
    let bestBodyD = BODY_LOCK_DEG * DEG2RAD;
    for (const b of frame.bodies) {
      if (b.alt < 0) continue;
      const d = angularDistance(b.alt, b.az, view.alt0, view.az0);
      if (d < bestBodyD) {
        bestBodyD = d;
        bestBody = {
          kind: b.kind,
          id: b.id,
          name: b.names[locale] || b.names.en,
          illumination: b.illumination,
        };
      }
    }
    if (bestBody) return bestBody;

    const limit = (view.fovDeg / 2) * DEG2RAD;
    let best: CenteredObject | null = null;
    let bestD = Infinity;
    for (const c of frame.constellations) {
      if (c.center.alt < 0) continue;
      const d = angularDistance(c.center.alt, c.center.az, view.alt0, view.az0);
      if (d < bestD && d < limit) {
        bestD = d;
        best = { kind: "constellation", id: c.id, name: c.names[locale] || c.names.en };
      }
    }
    return best;
  }, [frame, view.alt0, view.az0, view.fovDeg, locale]);

  const reticle = useMemo(
    () => makeAstrolicPath(cx, cy, RETICLE_SIZE),
    [cx, cy]
  );

  // Report to the HUD; the string key keeps the effect from firing for
  // sub-pixel changes that would not alter what the HUD displays.
  const report = `${Math.round(view.alt0 * 573)}|${Math.round(view.az0 * 573)}|${view.fovDeg.toFixed(0)}|${scene.visibleCount}|${centered?.id ?? ""}`;
  const visibleCount = scene.visibleCount;
  useEffect(() => {
    onReadout?.({ ...view, magLimit, visibleCount, centered });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, onReadout]);

  // ---- gestures ------------------------------------------------------------
  const beginGesture = useCallback(() => {
    startRef.current = view;
  }, [view]);

  useEffect(() => {
    if (!live || !look) return;
    setView((v) => ({
      ...v,
      alt0: clamp(look.alt, ALT_MIN, ALT_MAX),
      az0: look.az,
    }));
  }, [live, look]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!live)
        .runOnJS(true)
        .minDistance(2)
        .onStart(beginGesture)
        .onUpdate((e) => {
          const start = startRef.current;
          const scale = focalScale(start.fovDeg * DEG2RAD, width);
          const dAlt = Math.atan(e.translationY / scale);
          const alt0 = clamp(start.alt0 + dAlt, ALT_MIN, ALT_MAX);
          const dAz =
            Math.atan(e.translationX / scale) /
            Math.max(Math.cos((start.alt0 + alt0) / 2), 0.15);
          setView((v) => ({ ...v, alt0, az0: normalizeAz(start.az0 + dAz) }));
        }),
    [beginGesture, width, live]
  );

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onStart(beginGesture)
        .onUpdate((e) => {
          const start = startRef.current;
          const fovDeg = clamp(start.fovDeg / e.scale, FOV_MIN, FOV_MAX);
          setView((v) => ({ ...v, fovDeg }));
        }),
    [beginGesture]
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .numberOfTaps(2)
        .onEnd(() => {
          if (live) return;
          setView({ alt0: sector.alt0, az0: sector.az0, fovDeg: sector.fovDeg });
        }),
    [sector, live]
  );

  const gesture = useMemo(
    () => Gesture.Simultaneous(pan, pinch, doubleTap),
    [pan, pinch, doubleTap]
  );

  const showNames = view.fovDeg < NAME_FOV_MAX;
  const dotScale = clamp(1.25 - view.fovDeg / 140, 0.85, 1.2);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height, backgroundColor: SKY.bg }}>
        <Canvas style={{ width, height }}>
          {/* constellation lines */}
          <Path
            path={scene.lines}
            style="stroke"
            strokeWidth={0.8}
            color={SKY.constellationLine}
          />

          {/* horizon */}
          {scene.horizon ? (
            <Path
              path={scene.horizon}
              style="stroke"
              strokeWidth={1}
              color={SKY.horizon}
            >
              <DashPathEffect intervals={[3, 7]} />
            </Path>
          ) : null}

          {/* stars, batched per magnitude bucket */}
          <Group>
            {STAR_BUCKETS.map((b) =>
              scene.points[b].length ? (
                <Points
                  key={b}
                  points={scene.points[b]}
                  mode="points"
                  style="stroke"
                  strokeCap="round"
                  strokeWidth={BUCKET_SIZE[b] * dotScale}
                  color={SKY.fg}
                  opacity={BUCKET_OPACITY[b]}
                />
              ) : null
            )}
          </Group>

          {/* constellation abbreviations */}
          {labelFont ? (
            <ConstellationLabels
              font={labelFont}
              labels={scene.labels}
              nearestId={centered?.id ?? null}
            />
          ) : null}

          {/* proper names of the brightest stars, when zoomed in */}
          {nameFont && showNames
            ? scene.named.map((n, i) => (
                <SkText
                  key={i}
                  x={n.x + 7}
                  y={n.y + 3}
                  text={n.star.name!.toUpperCase()}
                  font={nameFont}
                  color={SKY.fg50}
                />
              ))
            : null}

          {/* Sun, Moon, planets: hollow rings + label */}
          <BodyMarkers
            bodies={scene.bodies}
            font={nameFont}
            locale={locale}
            activeId={centered?.kind !== "constellation" ? centered?.id ?? null : null}
          />

          {/* vignette */}
          <Rect x={0} y={0} width={width} height={height}>
            <RadialGradient
              c={vec(cx, cy)}
              r={Math.hypot(width, height) / 2}
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]}
              positions={[0, 0.5, 1]}
            />
          </Rect>

          {/* reticle: hollow Astrolic mark + exact pointing dot */}
          <Path
            path={reticle}
            style="stroke"
            strokeWidth={0.9}
            strokeJoin="round"
            color={SKY.fg50}
          />
          <Circle cx={cx} cy={cy} r={1} color={SKY.fg70} />

          {/* corner brackets */}
          <CornerBrackets width={width} height={height} />
        </Canvas>
      </View>
    </GestureDetector>
  );
}

function ConstellationLabels({
  font,
  labels,
  nearestId,
}: {
  font: SkFont;
  labels: ReturnType<typeof buildScene>["labels"];
  nearestId: string | null;
}) {
  return (
    <>
      {labels.map((l) => {
        const text = l.constellation.id.toUpperCase();
        const w = font.getTextWidth(text);
        const active = l.constellation.id === nearestId;
        return (
          <SkText
            key={l.constellation.id}
            x={l.x - w / 2}
            y={l.y + 4}
            text={text}
            font={font}
            color={active ? SKY.fg70 : SKY.fg35}
          />
        );
      })}
    </>
  );
}

const BODY_RING_R: Record<ProjectedBody["body"]["kind"], number> = {
  sun: 7.5,
  moon: 7,
  planet: 5,
};

/**
 * Sun, Moon and planets as thin hollow rings with a monospace label. Planets
 * get a centre dot; the Sun gets four short rays. Nothing else in the scene
 * is drawn as a ring, so these read unambiguously as "not a star".
 */
function BodyMarkers({
  bodies,
  font,
  locale,
  activeId,
}: {
  bodies: ProjectedBody[];
  font: SkFont | null;
  locale: SkyLocale;
  activeId: string | null;
}) {
  return (
    <Group>
      {bodies.map(({ x, y, body }) => {
        const r = BODY_RING_R[body.kind];
        const active = body.id === activeId;
        const color = active ? SKY.fg : SKY.fg70;
        const label = (body.names[locale] || body.names.en).toUpperCase();
        return (
          <Group key={body.id}>
            <Circle cx={x} cy={y} r={r} style="stroke" strokeWidth={1} color={color} />
            {body.kind === "planet" ? (
              <Circle cx={x} cy={y} r={1.2} color={color} />
            ) : null}
            {body.kind === "sun" ? (
              <>
                <Line p1={vec(x - r - 5, y)} p2={vec(x - r - 2, y)} strokeWidth={1} color={color} />
                <Line p1={vec(x + r + 2, y)} p2={vec(x + r + 5, y)} strokeWidth={1} color={color} />
                <Line p1={vec(x, y - r - 5)} p2={vec(x, y - r - 2)} strokeWidth={1} color={color} />
                <Line p1={vec(x, y + r + 2)} p2={vec(x, y + r + 5)} strokeWidth={1} color={color} />
              </>
            ) : null}
            {font ? (
              <SkText
                x={x + r + 6}
                y={y + 3.5}
                text={label}
                font={font}
                color={active ? SKY.fg : SKY.fg50}
              />
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
}

function CornerBrackets({ width, height }: { width: number; height: number }) {
  const inset = 14;
  const len = 12;
  const c = SKY.fg22;
  const w = 0.8;
  return (
    <Group>
      <Line p1={vec(inset, inset + len)} p2={vec(inset, inset)} strokeWidth={w} color={c} />
      <Line p1={vec(inset, inset)} p2={vec(inset + len, inset)} strokeWidth={w} color={c} />
      <Line p1={vec(width - inset - len, inset)} p2={vec(width - inset, inset)} strokeWidth={w} color={c} />
      <Line p1={vec(width - inset, inset)} p2={vec(width - inset, inset + len)} strokeWidth={w} color={c} />
      <Line p1={vec(inset, height - inset - len)} p2={vec(inset, height - inset)} strokeWidth={w} color={c} />
      <Line p1={vec(inset, height - inset)} p2={vec(inset + len, height - inset)} strokeWidth={w} color={c} />
      <Line p1={vec(width - inset - len, height - inset)} p2={vec(width - inset, height - inset)} strokeWidth={w} color={c} />
      <Line p1={vec(width - inset, height - inset)} p2={vec(width - inset, height - inset - len)} strokeWidth={w} color={c} />
    </Group>
  );
}
