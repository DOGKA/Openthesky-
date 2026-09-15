import { useCallback, useMemo, useState } from "react";
import { Pressable, View, type GestureResponderEvent } from "react-native";
import { Canvas, Skia } from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { MonoText } from "@/components/mono-text";
import type { SkyFrame } from "@/sky/frame";
import { COMPASS_8, DEG2RAD, RAD2DEG, normalizeAz } from "@/sky/math";
import { BAND_SPLIT_ALT_DEG, SECTORS, ZENITH_ALT_DEG, sectorAt, type SkySector } from "@/sky/sectors";
import { OpenSkyRadarGraphic } from "./radar-graphic";
import { radarRadiusForAlt } from "./geometry";

type Props = {
  frame: SkyFrame;
  size: number;
  magLimit?: number;
  onSelect: (sector: SkySector) => void;
  aim?: { alt: number; az: number } | null;
};

const LABEL_GAP = 16;
const HALF_PI = Math.PI / 2;

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
    const start = 270 - pressed.az0 * RAD2DEG - 22.5;
    path.addArc(Skia.XYWHRect(cx - r2, cy - r2, r2 * 2, r2 * 2), start, 45);
    path.arcToOval(Skia.XYWHRect(cx - r1, cy - r1, r1 * 2, r1 * 2), start + 45, -45, false);
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
      return sectorAt(HALF_PI * (1 - Math.min(r, R) / R), normalizeAz(Math.atan2(-dx, -dy)));
    },
    [cx, cy, R]
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
        onPressIn={(e) => setPressed(hitTest(e))}
        onPressOut={() => setPressed(null)}
        onPress={(e) => {
          const s = hitTest(e);
          if (!s) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onSelect(s);
        }}
        style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}
      />
    </View>
  );
}

export { SECTORS };
