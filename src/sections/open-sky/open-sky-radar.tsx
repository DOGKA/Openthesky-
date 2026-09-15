import { useCallback, useMemo, useState } from "react";
import { Pressable, View, type GestureResponderEvent } from "react-native";
import { Canvas, Skia } from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { MonoText } from "@/components/mono-text";
import type { SkyFrame } from "@/lib/sky/use-sky-frame";
import { COMPASS_8, DEG2RAD, RAD2DEG, normalizeAz } from "@/lib/sky/sky-math";
import {
  BAND_SPLIT_ALT_DEG,
  SECTORS,
  ZENITH_ALT_DEG,
  sectorAt,
  type SkySector,
} from "@/lib/sky/sky-sectors";
import { OpenSkyRadarGraphic, radarRadiusForAlt } from "./open-sky-radar-graphic";

type Props = {
  frame: SkyFrame;
  /** canvas side in px (square) */
  size: number;
  /** stars brighter than this are drawn */
  magLimit?: number;
  onSelect: (sector: SkySector) => void;
  aim?: { alt: number; az: number } | null;
};

const LABEL_GAP = 16;
const HALF_PI = Math.PI / 2;

/**
 * Interactive all-sky view: the radar graphic plus sector hit-testing and
 * RN compass labels. North is up and East is on the LEFT (a view of the sky
 * from below, the way a planisphere is printed).
 */
export function OpenSkyRadar({ frame, size, magLimit = 4.5, onSelect, aim = null }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - LABEL_GAP - 8;
  const [pressed, setPressed] = useState<SkySector | null>(null);

  const rZenith = radarRadiusForAlt(ZENITH_ALT_DEG, R);
  const rSplit = radarRadiusForAlt(BAND_SPLIT_ALT_DEG, R);

  const highlight = useMemo(() => {
    if (!pressed) return null;
    const path = Skia.Path.Make();
    if (pressed.band === "zenith") {
      path.addCircle(cx, cy, rZenith);
      return path;
    }
    const [r1, r2] = pressed.band === "high" ? [rZenith, rSplit] : [rSplit, R];
    const azDeg = pressed.az0 * RAD2DEG;
    // screen angle (clockwise from +x) = 270° − azimuth
    const start = 270 - azDeg - 22.5;
    const outer = Skia.XYWHRect(cx - r2, cy - r2, r2 * 2, r2 * 2);
    const inner = Skia.XYWHRect(cx - r1, cy - r1, r1 * 2, r1 * 2);
    path.addArc(outer, start, 45);
    path.arcToOval(inner, start + 45, -45, false);
    path.close();
    return path;
  }, [pressed, cx, cy, R, rZenith, rSplit]);

  const hitTest = useCallback(
    (e: GestureResponderEvent): SkySector | null => {
      const { locationX, locationY } = e.nativeEvent;
      const dx = locationX - cx;
      const dy = locationY - cy;
      const r = Math.hypot(dx, dy);
      if (r > R + 6) return null;
      const alt = HALF_PI * (1 - Math.min(r, R) / R);
      const az = normalizeAz(Math.atan2(-dx, -dy));
      return sectorAt(alt, az);
    },
    [cx, cy, R]
  );

  const onPressIn = useCallback((e: GestureResponderEvent) => setPressed(hitTest(e)), [hitTest]);
  const onPressOut = useCallback(() => setPressed(null), []);
  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      const s = hitTest(e);
      if (!s) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onSelect(s);
    },
    [hitTest, onSelect]
  );

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <OpenSkyRadarGraphic
          frame={frame}
          cx={cx}
          cy={cy}
          R={R}
          magLimit={magLimit}
          highlight={highlight}
          aim={aim}
        />
      </Canvas>

      {COMPASS_8.map((label, i) => {
        const az = i * 45 * DEG2RAD;
        const rr = R + LABEL_GAP;
        const x = cx - rr * Math.sin(az);
        const y = cy - rr * Math.cos(az);
        const cardinal = i % 2 === 0;
        return (
          <View
            key={label}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: x - 14,
              top: y - 8,
              width: 28,
              height: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MonoText size={cardinal ? 11 : 9} dim={cardinal ? "soft" : "faint"} medium={cardinal}>
              {label}
            </MonoText>
          </View>
        );
      })}

      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}
      />
    </View>
  );
}

export { SECTORS };
