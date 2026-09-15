import { useCallback, useMemo, useRef } from "react";
import { Pressable, View } from "react-native";
import { Canvas, Line, vec } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/lib/theme";

export type TimePreset = { id: string; label: string; offsetMs: number };

type Props = {
  /** the instant currently shown */
  date: Date;
  offsetMs: number;
  onChange: (offsetMs: number) => void;
  presets: TimePreset[];
  width: number;
  localeTag: string;
  hint: string;
};

const HEIGHT = 40;
const PX_PER_HOUR = 72;
const MS_PER_PX = 3600000 / PX_PER_HOUR;

/**
 * Horizontal time ruler: drag left to move forward in time, right to go back.
 * Ticks every 15 minutes, taller every hour. Presets jump to fixed offsets.
 */
export function OpenSkyTimeScrubber({
  date,
  offsetMs,
  onChange,
  presets,
  width,
  localeTag,
  hint,
}: Props) {
  const startRef = useRef(offsetMs);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(1)
        .onStart(() => {
          startRef.current = offsetMs;
        })
        .onUpdate((e) => {
          const next = startRef.current - e.translationX * MS_PER_PX;
          onChange(Math.round(next / 60000) * 60000);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, offsetMs]
  );

  const ticks = useMemo(() => {
    const cx = width / 2;
    const out: { x: number; h: number; major: boolean }[] = [];
    const quarter = 900000; // 15 min
    const t0 = date.getTime();
    // first tick left of the viewport
    const firstTick = Math.floor((t0 - (cx / PX_PER_HOUR) * 3600000) / quarter) * quarter;
    for (let t = firstTick; ; t += quarter) {
      const x = cx + ((t - t0) / 3600000) * PX_PER_HOUR;
      if (x > width) break;
      if (x < 0) continue;
      const major = t % 3600000 === 0;
      out.push({ x, h: major ? 12 : 6, major });
    }
    return out;
  }, [date, width]);

  const label = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(localeTag, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(date);
    } catch {
      return date.toISOString().slice(0, 16).replace("T", " ");
    }
  }, [date, localeTag]);

  const jump = useCallback(
    (ms: number) => {
      Haptics.selectionAsync().catch(() => {});
      onChange(ms);
    },
    [onChange]
  );

  return (
    <View style={{ width, gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16 }}>
        <MonoText size={11} dim="soft" medium tracking={0.2}>
          {label}
        </MonoText>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {presets.map((p) => {
            const active = Math.abs(p.offsetMs - offsetMs) < 60000;
            return (
              <Pressable
                key={p.id}
                onPress={() => jump(p.offsetMs)}
                hitSlop={6}
                style={{
                  paddingVertical: 3,
                  paddingHorizontal: 7,
                  borderRadius: 3,
                  borderWidth: 1,
                  borderColor: active ? SKY.fg50 : SKY.fg22,
                  backgroundColor: active ? SKY.fg12 : "transparent",
                }}
              >
                <MonoText size={9} dim={active ? "none" : "muted"} upper tracking={0.8}>
                  {p.label}
                </MonoText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <GestureDetector gesture={pan}>
        <View style={{ width, height: HEIGHT }} accessibilityLabel={hint}>
          <Canvas style={{ width, height: HEIGHT }}>
            <Line p1={vec(0, HEIGHT - 1)} p2={vec(width, HEIGHT - 1)} strokeWidth={0.8} color={SKY.fg12} />
            {ticks.map((tk, i) => (
              <Line
                key={i}
                p1={vec(tk.x, HEIGHT - 1)}
                p2={vec(tk.x, HEIGHT - 1 - tk.h)}
                strokeWidth={tk.major ? 1 : 0.6}
                color={tk.major ? SKY.fg35 : SKY.fg22}
              />
            ))}
            {/* centre marker */}
            <Line p1={vec(width / 2, 4)} p2={vec(width / 2, HEIGHT)} strokeWidth={1} color={SKY.accent} />
          </Canvas>
        </View>
      </GestureDetector>
    </View>
  );
}
