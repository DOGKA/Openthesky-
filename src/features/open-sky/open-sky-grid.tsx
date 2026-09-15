import { Pressable, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import { formatLatLon, formatLst, formatTime } from "@/format";
import type { SkyFrame } from "@/sky/frame";
import type { SkySector } from "@/sky/sectors";
import type { TFn } from "@/i18n";
import { LiveCounter } from "@/features/home/live-counter";
import { OpenSkyRadar } from "./radar/radar";
import { OpenSkyTimeScrubber, type TimePreset } from "./time-scrubber";
import { GRID_MAG_LIMIT } from "./use-open-sky";

export function OpenSkyGrid({
  frame,
  date,
  latitude,
  longitude,
  approx,
  observerLabel,
  onBack,
  t,
  tag,
  offsetMs,
  onOffset,
  presets,
  onSelect,
  onLive,
  aim,
}: {
  frame: SkyFrame;
  date: Date;
  latitude: number;
  longitude: number;
  approx: boolean;
  observerLabel?: string;
  onBack?: () => void;
  t: TFn;
  tag: string;
  offsetMs: number;
  onOffset: (ms: number) => void;
  presets: TimePreset[];
  onSelect: (s: SkySector) => void;
  onLive: () => void;
  aim: { alt: number; az: number } | null;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const radarSize = Math.min(width - 24, height - insets.top - insets.bottom - 240);
  const aboveHorizon = countVisible(frame.stars, GRID_MAG_LIMIT);

  return (
    <Animated.View
      key="grid"
      entering={FadeIn.duration(260)}
      exiting={FadeOut.duration(180)}
      style={{
        flex: 1,
        backgroundColor: SKY.bg,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 20,
        justifyContent: "space-between",
      }}
    >
      <StatusBar style="light" />
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ gap: 4 }}>
            {onBack ? (
              <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: 6 }}>
                <MonoText size={10} dim="soft" upper>
                  ← {t("back")}
                </MonoText>
              </Pressable>
            ) : null}
            <MonoText size={10} dim="faint" upper>
              01 / {t("title")}
            </MonoText>
            <MonoText size={12} dim="soft">
              {observerLabel ?? t("subtitle")}
            </MonoText>
          </View>
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <Pressable
              onPress={onLive}
              hitSlop={8}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: SKY.fg22,
                borderRadius: 4,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <MonoText size={10} dim="soft" upper>
                {t("live")}
              </MonoText>
            </Pressable>
            <MonoText size={10} dim="faint">
              {observerLabel ? formatTime(date, tag) : `${formatTime(date, tag)} ${t("local")}`}
            </MonoText>
            <MonoText size={10} dim="faint">
              {formatLatLon(latitude, longitude)}
            </MonoText>
          </View>
        </View>
        {!observerLabel ? <LiveCounter compact /> : null}
      </View>
      <View style={{ alignItems: "center" }}>
        <OpenSkyRadar frame={frame} size={radarSize} magLimit={GRID_MAG_LIMIT} onSelect={onSelect} aim={aim} />
      </View>
      <View style={{ gap: 10 }}>
        <OpenSkyTimeScrubber
          date={date}
          offsetMs={offsetMs}
          onChange={onOffset}
          presets={presets}
          width={width - 40}
          localeTag={tag}
          hint={t("time_hint")}
        />
        <View style={{ height: 1, backgroundColor: SKY.fg12 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <MonoText size={9} dim="faint">
            {t("mag")} ≤ {GRID_MAG_LIMIT.toFixed(1)} · {aboveHorizon} {t("stars").toUpperCase()}
          </MonoText>
          <MonoText size={9} dim="faint">
            LST {formatLst(frame.lstDeg)}
            {approx ? ` · ${t("approx").toUpperCase()}` : ""}
          </MonoText>
        </View>
      </View>
    </Animated.View>
  );
}

function countVisible(stars: { mag: number; alt: number }[], magLimit: number) {
  let n = 0;
  for (const s of stars) {
    if (s.mag > magLimit) break;
    if (s.alt > 0) n++;
  }
  return n;
}
