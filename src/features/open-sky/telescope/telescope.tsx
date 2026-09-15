import { memo, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import {
  Canvas,
  Circle,
  DashPathEffect,
  Path,
  RadialGradient,
  Rect,
  Text as SkText,
  useFont,
  vec,
} from "@shopify/react-native-skia";
import { GestureDetector } from "react-native-gesture-handler";
import { GeistMono_400Regular } from "@expo-google-fonts/geist-mono/400Regular";
import { SKY } from "@/theme";
import { makeAstrolicPath } from "@/astrolic-mark";
import { buildScene } from "@/sky/scene";
import { clamp, magLimitForFov } from "@/sky/math";
import { BodyMarkers } from "./body-markers";
import { ConstellationLabels } from "./constellation-labels";
import { CornerBrackets } from "./corner-brackets";
import { StarField } from "./star-field";
import { ZoomControls } from "./zoom-controls";
import { FOV_MAX, FOV_MIN, NAME_FOV_MAX, RETICLE_SIZE, type TelescopeProps, type TelescopeState } from "./types";
import { useCenteredObject } from "./centered-object";
import { useReadoutReporter } from "./use-readout";
import { useLiveLook, useTelescopeGestures } from "./use-telescope-gestures";

export type { TelescopeReadout, TelescopeState, CenteredObject } from "./types";

/** Memoised: HUD readout updates must not re-render the whole canvas. */
export const OpenSkyTelescope = memo(function OpenSkyTelescope({
  frame,
  sector,
  width,
  height,
  locale,
  onReadout,
  live = false,
  look = null,
}: TelescopeProps) {
  const [view, setView] = useState<TelescopeState>({
    alt0: sector.alt0,
    az0: sector.az0,
    fovDeg: sector.fovDeg,
  });
  const labelFont = useFont(GeistMono_400Regular, 10);
  const nameFont = useFont(GeistMono_400Regular, 9);
  const cx = width / 2;
  const cy = height / 2;
  const magLimit = magLimitForFov(view.fovDeg);

  const scene = useMemo(
    () =>
      buildScene(frame, { cx, cy, width, height, alt0: view.alt0, az0: view.az0, fovDeg: view.fovDeg }, {
        magLimit,
        labelMaxRank: 2,
        horizon: true,
        lines: true,
      }),
    [frame, cx, cy, width, height, view.alt0, view.az0, view.fovDeg, magLimit]
  );

  const centered = useCenteredObject(frame, view, locale);
  const reticle = useMemo(() => makeAstrolicPath(cx, cy, RETICLE_SIZE), [cx, cy]);
  const report = `${Math.round(view.alt0 * 573)}|${Math.round(view.az0 * 573)}|${view.fovDeg.toFixed(0)}|${scene.visibleCount}|${centered?.id ?? ""}`;
  useReadoutReporter(
    { ...view, magLimit, visibleCount: scene.visibleCount, centered },
    report,
    onReadout
  );

  useLiveLook(live, look, setView);
  const gesture = useTelescopeGestures(view, setView, width, live, sector);
  const showNames = view.fovDeg < NAME_FOV_MAX;
  const zoomBy = useCallback((factor: number) => {
    setView((v) => ({ ...v, fovDeg: clamp(v.fovDeg * factor, FOV_MIN, FOV_MAX) }));
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height, backgroundColor: SKY.bg }}>
        <Canvas style={{ width, height }}>
          <Path path={scene.lines} style="stroke" strokeWidth={0.8} color={SKY.constellationLine} />
          {scene.horizon ? (
            <Path path={scene.horizon} style="stroke" strokeWidth={1} color={SKY.horizon}>
              <DashPathEffect intervals={[3, 7]} />
            </Path>
          ) : null}
          <StarField points={scene.points} featured={scene.featured} fovDeg={view.fovDeg} />
          {labelFont ? (
            <ConstellationLabels font={labelFont} labels={scene.labels} nearestId={centered?.id ?? null} />
          ) : null}
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
          <BodyMarkers
            bodies={scene.bodies}
            font={nameFont}
            locale={locale}
            activeId={centered?.kind !== "constellation" ? centered?.id ?? null : null}
          />
          <Rect x={0} y={0} width={width} height={height}>
            <RadialGradient
              c={vec(cx, cy)}
              r={Math.hypot(width, height) / 2}
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]}
              positions={[0, 0.5, 1]}
            />
          </Rect>
          <Path path={reticle} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKY.fg50} />
          <Circle cx={cx} cy={cy} r={1} color={SKY.fg70} />
          <CornerBrackets width={width} height={height} />
        </Canvas>
        <ZoomControls fovDeg={view.fovDeg} onZoomIn={() => zoomBy(0.78)} onZoomOut={() => zoomBy(1.28)} />
      </View>
    </GestureDetector>
  );
});
