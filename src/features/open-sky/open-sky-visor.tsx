import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { SKY } from "@/theme";
import type { Locale, TFn } from "@/i18n";
import type { SkyFrame } from "@/sky/frame";
import type { SkySector } from "@/sky/sectors";
import type { DeviceLookState } from "@/hooks/use-device-look";
import { OpenSkyTelescope, type TelescopeReadout } from "./telescope/telescope";
import { OpenSkyHud } from "./hud/hud";
import { OpenSkyTimeScrubber, type TimePreset } from "./time-scrubber";

export function OpenSkyVisor({
  frame,
  sector,
  locale,
  t,
  tag,
  date,
  location,
  label,
  live,
  look,
  liveState,
  readout,
  onReadout,
  onBack,
  onToggleLive,
  offsetMs,
  onOffset,
  presets,
}: {
  frame: SkyFrame;
  sector: SkySector;
  locale: Locale;
  t: TFn;
  tag: string;
  date: Date;
  location: { latitude: number; longitude: number; approx?: boolean };
  label?: string;
  live: boolean;
  look: DeviceLookState["look"];
  liveState: DeviceLookState;
  readout: TelescopeReadout | null;
  onReadout: (r: TelescopeReadout) => void;
  onBack: () => void;
  onToggleLive: () => void;
  offsetMs: number;
  onOffset: (ms: number) => void;
  presets: TimePreset[];
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const liveNote = !live
    ? null
    : liveState.error === "denied"
      ? t("live_denied")
      : liveState.headingUnreliable
        ? t("live_no_heading")
        : t("live_hint");

  return (
    <Animated.View
      key="telescope"
      entering={FadeIn.duration(260)}
      exiting={FadeOut.duration(180)}
      style={{ flex: 1, backgroundColor: SKY.bg }}
    >
      <StatusBar style="light" />
      <OpenSkyTelescope
        frame={frame}
        sector={sector}
        width={width}
        height={height}
        locale={locale}
        onReadout={onReadout}
        live={live}
        look={look}
      />
      <OpenSkyHud
        readout={readout}
        location={location}
        label={label}
        now={date}
        t={t}
        topInset={insets.top}
        bottomInset={insets.bottom}
        onBack={onBack}
        live={live}
        onToggleLive={onToggleLive}
        liveNote={liveNote}
        timeline={
          <OpenSkyTimeScrubber
            date={date}
            offsetMs={offsetMs}
            onChange={onOffset}
            presets={presets}
            width={width}
            localeTag={tag}
            hint={t("time_hint")}
          />
        }
      />
    </Animated.View>
  );
}
