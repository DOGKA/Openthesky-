import type { ReactNode } from "react";
import { View } from "react-native";
import type { TFn } from "@/i18n";
import { compassLabel, fmtAlt, fmtDeg } from "@/sky/math";
import type { TelescopeReadout } from "../telescope/types";
import { HudBottom } from "./hud-bottom";
import { HudStat } from "./hud-stat";
import { HudTopBar } from "./hud-top";

type Props = {
  readout: TelescopeReadout | null;
  location: { latitude: number; longitude: number; approx?: boolean };
  label?: string;
  now: Date;
  t: TFn;
  topInset: number;
  bottomInset: number;
  onBack: () => void;
  timeline?: ReactNode;
  live?: boolean;
  onToggleLive?: () => void;
  liveNote?: string | null;
};

export function OpenSkyHud({
  readout,
  location,
  label,
  now,
  t,
  topInset,
  bottomInset,
  onBack,
  timeline,
  live = false,
  onToggleLive,
  liveNote,
}: Props) {
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", inset: 0 }}>
      <HudTopBar
        t={t}
        live={live}
        onBack={onBack}
        onToggleLive={onToggleLive}
        caption={live ? t("live_hint") : label ?? `${time} ${t("local")}`}
        topInset={topInset}
      />
      {readout ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: topInset + 56,
            left: 16,
            right: 16,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <HudStat label={t("azimuth")} value={`${fmtDeg(readout.az0)} ${compassLabel(readout.az0)}`} />
          <HudStat label={t("altitude")} value={fmtAlt(readout.alt0)} align="center" />
          <HudStat label={t("fov")} value={`${readout.fovDeg.toFixed(0)}°`} align="right" />
        </View>
      ) : null}
      <HudBottom
        readout={readout}
        location={location}
        t={t}
        bottomInset={bottomInset}
        timeline={timeline}
        liveNote={liveNote}
      />
    </View>
  );
}
