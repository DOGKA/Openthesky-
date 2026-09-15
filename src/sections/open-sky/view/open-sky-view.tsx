import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/lib/theme";
import { useNow } from "@/hooks/use-now";
import { useDeviceLook } from "@/hooks/use-device-look";
import { useDeviceLocation } from "@/providers/device-location-provider";
import { useSkyFrame } from "@/lib/sky/use-sky-frame";
import { DEG2RAD } from "@/lib/sky/sky-math";
import type { SkySector } from "@/lib/sky/sky-sectors";
import { useLocale } from "@/providers/locale-provider";
import { formatLatLon, formatLst, formatTime } from "@/lib/format";
import { nextBirthdayInstant, type BirthProfile, type Observer } from "@/lib/profiles";
import { LiveCounter } from "@/sections/home/live-counter";
import { OpenSkyLocationGate } from "../open-sky-location-gate";
import { OpenSkyRadar } from "../open-sky-radar";
import { OpenSkyTelescope, type TelescopeReadout } from "../open-sky-telescope";
import { OpenSkyHud } from "../open-sky-hud";
import { OpenSkyTimeScrubber, type TimePreset } from "../open-sky-time-scrubber";

const GRID_MAG_LIMIT = 4.5;

const LIVE_SECTOR: SkySector = {
  id: "live",
  band: "low",
  alt0: 35 * DEG2RAD,
  az0: 0,
  fovDeg: 50,
  altRange: [0, 90],
};

type Props = {
  /**
   * Fixed observer (a birth moment at a birth place). When omitted the view
   * uses the device location and the live clock.
   */
  observer?: Observer;
  /** profile the observer belongs to; enables the birth / next-birthday presets */
  profile?: BirthProfile;
  onBack?: () => void;
};

export function OpenSkyView({ observer, profile, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { locale, tag, t } = useLocale();

  // ---- where & when ----------------------------------------------------------
  const now = useNow(30000);
  const device = useDeviceLocation();
  const latitude = observer ? observer.latitude : device.location?.latitude ?? null;
  const longitude = observer ? observer.longitude : device.location?.longitude ?? null;
  const approx = !observer && device.location?.source === "fallback";

  const [offsetMs, setOffsetMs] = useState(0);
  const base = observer?.date ?? now;
  const date = useMemo(() => new Date(base.getTime() + offsetMs), [base, offsetMs]);

  const frame = useSkyFrame(latitude, longitude, date);

  const presets = useMemo<TimePreset[]>(() => {
    if (observer?.date && profile) {
      const birth = observer.date.getTime();
      return [
        { id: "birth", label: t("time_birth"), offsetMs: 0 },
        { id: "now", label: t("time_now"), offsetMs: Date.now() - birth },
        {
          id: "next",
          label: t("time_next_birthday"),
          offsetMs: nextBirthdayInstant(profile).getTime() - birth,
        },
      ];
    }
    return [{ id: "now", label: t("time_now"), offsetMs: 0 }];
  }, [observer, profile, t]);

  const [sector, setSector] = useState<SkySector | null>(null);
  const [readout, setReadout] = useState<TelescopeReadout | null>(null);
  const [live, setLive] = useState(false);
  const deviceLook = useDeviceLook(live);

  const openSector = useCallback((s: SkySector) => {
    setReadout(null);
    setLive(false);
    setSector(s);
  }, []);
  const closeSector = useCallback(() => {
    setLive(false);
    setSector(null);
  }, []);
  const startLive = useCallback(() => {
    setReadout(null);
    setLive(true);
    setSector((s) => s ?? LIVE_SECTOR);
  }, []);
  const toggleLive = useCallback(() => {
    setLive((on) => {
      if (on) return false;
      setSector((s) => s ?? LIVE_SECTOR);
      return true;
    });
  }, []);

  // ---- location gate ---------------------------------------------------------
  if (!observer && (device.status !== "ready" || !device.location)) {
    return (
      <View style={{ flex: 1, backgroundColor: SKY.bg, paddingBottom: insets.bottom }}>
        <StatusBar style="light" />
        <OpenSkyLocationGate
          status={device.status}
          t={t}
          onRequest={device.request}
          onFallback={device.useFallback}
          onRetry={device.retry}
        />
      </View>
    );
  }

  if (!frame || latitude == null || longitude == null) {
    return (
      <View style={{ flex: 1, backgroundColor: SKY.bg, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <StatusBar style="light" />
        <ActivityIndicator color={SKY.fg50} />
        <MonoText size={10} dim="faint" upper>
          {t("computing")}
        </MonoText>
      </View>
    );
  }

  const location = { latitude, longitude, approx };

  // ---- telescope -------------------------------------------------------------
  if (sector) {
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
          onReadout={setReadout}
          live={live}
          look={deviceLook.look}
        />
        <OpenSkyHud
          readout={readout}
          location={location}
          label={observer?.label}
          now={date}
          t={t}
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={closeSector}
          live={live}
          onToggleLive={toggleLive}
          liveNote={
            !live
              ? null
              : deviceLook.error === "denied"
                ? t("live_denied")
                : deviceLook.headingUnreliable
                  ? t("live_no_heading")
                  : t("live_hint")
          }
          timeline={
            <OpenSkyTimeScrubber
              date={date}
              offsetMs={offsetMs}
              onChange={setOffsetMs}
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

  // ---- grid ------------------------------------------------------------------
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
              {observer ? observer.label : t("subtitle")}
            </MonoText>
          </View>
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <Pressable
              onPress={startLive}
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
              {observer?.date
                ? formatTime(date, tag)
                : `${formatTime(date, tag)} ${t("local")}`}
            </MonoText>
            <MonoText size={10} dim="faint">
              {formatLatLon(latitude, longitude)}
            </MonoText>
          </View>
        </View>
        {!observer ? <LiveCounter compact /> : null}
      </View>

      <View style={{ alignItems: "center" }}>
        <OpenSkyRadar
          frame={frame}
          size={radarSize}
          magLimit={GRID_MAG_LIMIT}
          onSelect={openSector}
          aim={deviceLook.look}
        />
      </View>

      <View style={{ gap: 10 }}>
        <OpenSkyTimeScrubber
          date={date}
          offsetMs={offsetMs}
          onChange={setOffsetMs}
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
