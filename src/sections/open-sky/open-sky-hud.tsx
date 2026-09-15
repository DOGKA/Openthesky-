import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/lib/theme";
import type { TFn } from "@/lib/i18n";
import { compassLabel, fmtAlt, fmtDeg } from "@/lib/sky/sky-math";
import type { TelescopeReadout } from "./open-sky-telescope";

type Props = {
  readout: TelescopeReadout | null;
  location: { latitude: number; longitude: number; approx?: boolean };
  /** short observer label, e.g. "İstanbul · doğum dakikası"; falls back to the clock */
  label?: string;
  now: Date;
  t: TFn;
  topInset: number;
  bottomInset: number;
  onBack: () => void;
  /** optional control rendered above the stats row (time scrubber) */
  timeline?: ReactNode;
  live?: boolean;
  onToggleLive?: () => void;
  liveNote?: string | null;
};

/**
 * Text overlay for the telescope view. Pure RN <Text> in Geist Mono so it
 * uses the app's typography pipeline rather than Skia text.
 */
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
      {/* top bar */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: topInset + 8,
          left: 16,
          right: 16,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={onBack}
          hitSlop={12}
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
            ← {t("grid")}
          </MonoText>
        </Pressable>

        <View style={{ alignItems: "flex-end", gap: 6 }}>
          {onToggleLive ? (
            <Pressable
              onPress={onToggleLive}
              hitSlop={8}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: live ? SKY.accent : SKY.fg22,
                backgroundColor: live ? "rgba(159,180,255,0.12)" : "transparent",
                borderRadius: 4,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <MonoText size={10} dim={live ? "none" : "soft"} upper style={live ? { color: SKY.accent } : undefined}>
                {live ? t("live_on") : t("live")}
              </MonoText>
            </Pressable>
          ) : (
            <MonoText size={10} dim="muted" upper>
              {t("title")}
            </MonoText>
          )}
          <MonoText size={10} dim="faint" upper>
            {live ? t("live_hint") : label ?? `${time} ${t("local")}`}
          </MonoText>
        </View>
      </View>

      {/* readout: direction, altitude, fov */}
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
          <Stat label={t("azimuth")} value={`${fmtDeg(readout.az0)} ${compassLabel(readout.az0)}`} />
          <Stat label={t("altitude")} value={fmtAlt(readout.alt0)} align="center" />
          <Stat label={t("fov")} value={`${readout.fovDeg.toFixed(0)}°`} align="right" />
        </View>
      ) : null}

      {/* bottom: centered constellation + stats + location */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          bottom: bottomInset + 14,
          left: 16,
          right: 16,
          gap: 10,
        }}
      >
        <View pointerEvents="none" style={{ minHeight: 36, justifyContent: "flex-end" }}>
          {readout?.centered ? (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <MonoText size={11} dim="muted">
                {readout.centered.kind === "constellation"
                  ? readout.centered.id.toUpperCase()
                  : "◎"}
              </MonoText>
              <MonoText size={15} dim="none" medium tracking={0.2}>
                {readout.centered.name}
              </MonoText>
              {readout.centered.kind === "moon" &&
              readout.centered.illumination != null ? (
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
            {formatCoord(location.latitude, "N", "S")}{" "}
            {formatCoord(location.longitude, "E", "W")}
            {location.approx ? ` · ${t("approx").toUpperCase()}` : ""}
          </MonoText>
        </View>
        {liveNote ? (
          <MonoText size={9} dim="faint">
            {liveNote}
          </MonoText>
        ) : null}
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "center" | "right";
}) {
  const alignItems =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  return (
    <View style={{ alignItems, gap: 1 }}>
      <MonoText size={9} dim="faint" upper>
        {label}
      </MonoText>
      <MonoText size={13} dim="soft" medium tracking={0.3}>
        {value}
      </MonoText>
    </View>
  );
}

function formatCoord(v: number, pos: string, neg: string): string {
  return `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`;
}
