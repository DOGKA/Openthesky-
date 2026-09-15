import type { ReactNode } from "react";
import { View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import { formatCoord } from "@/format";
import type { TFn } from "@/i18n";
import type { TelescopeReadout } from "../telescope/types";

export function HudBottom({
  readout,
  location,
  t,
  bottomInset,
  timeline,
  liveNote,
}: {
  readout: TelescopeReadout | null;
  location: { latitude: number; longitude: number; approx?: boolean };
  t: TFn;
  bottomInset: number;
  timeline?: ReactNode;
  liveNote?: string | null;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", bottom: bottomInset + 14, left: 16, right: 16, gap: 10 }}
    >
      <View pointerEvents="none" style={{ minHeight: 36, justifyContent: "flex-end" }}>
        {readout?.centered ? (
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <MonoText size={11} dim="muted">
              {readout.centered.kind === "constellation" ? readout.centered.id.toUpperCase() : "◎"}
            </MonoText>
            <MonoText size={15} dim="none" medium tracking={0.2}>
              {readout.centered.name}
            </MonoText>
            {readout.centered.kind === "moon" && readout.centered.illumination != null ? (
              <MonoText size={11} dim="muted">
                {Math.round(readout.centered.illumination * 100)}%
              </MonoText>
            ) : null}
          </View>
        ) : null}
      </View>
      {timeline ? <View style={{ marginHorizontal: -16 }}>{timeline}</View> : null}
      <View pointerEvents="none" style={{ height: 1, backgroundColor: SKY.fg12 }} />
      <View pointerEvents="none" style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <MonoText size={9} dim="faint">
          {t("mag")} ≤ {readout ? readout.magLimit.toFixed(1) : "–"} ·{" "}
          {readout ? readout.visibleCount : "–"} {t("stars").toUpperCase()}
        </MonoText>
        <MonoText size={9} dim="faint">
          {formatCoord(location.latitude, "N", "S")} {formatCoord(location.longitude, "E", "W")}
          {location.approx ? ` · ${t("approx").toUpperCase()}` : ""}
        </MonoText>
      </View>
      {liveNote ? (
        <MonoText size={9} dim="faint">
          {liveNote}
        </MonoText>
      ) : null}
    </View>
  );
}
