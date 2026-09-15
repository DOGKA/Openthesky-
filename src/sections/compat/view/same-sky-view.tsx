import { ActivityIndicator, ScrollView, View, useWindowDimensions } from "react-native";
import { Canvas } from "@shopify/react-native-skia";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MonoText } from "@/components/mono-text";
import { Divider, Fact, OutlineButton, Panel, ScreenHeader, SectionLabel } from "@/components/ui";
import { SKY } from "@/lib/theme";
import { formatDate, formatTime } from "@/lib/format";
import { birthInstant, birthObserver, cityById, useProfiles } from "@/lib/profiles";
import {
  bodyName,
  compareSkies,
  constellationName,
  zodiacName,
} from "@/lib/sky/sky-insights";
import { useSkyFrame } from "@/lib/sky/use-sky-frame";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import { OpenSkyRadarGraphic } from "@/sections/open-sky/open-sky-radar-graphic";

/**
 * Side-by-side comparison of two birth skies: shared constellations, zenith
 * stars, rising signs and Moon. Opened from a friend's profile.
 */
export function SameSkyView({ aId, bId }: { aId: string; bId: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { locale, tag, t } = useLocale();
  const nav = useNavigation();
  const { byId, me } = useProfiles();
  const a = byId(aId) ?? me;
  const b = byId(bId) ?? me;

  const obsA = birthObserver(a, a.name);
  const obsB = birthObserver(b, b.name);
  const frameA = useSkyFrame(obsA.latitude, obsA.longitude, obsA.date!);
  const frameB = useSkyFrame(obsB.latitude, obsB.longitude, obsB.date!);
  const cmp = frameA && frameB ? compareSkies(frameA, frameB) : null;

  const radar = Math.min((width - 52) / 2, 160);
  const cityA = cityById(a.cityId);
  const cityB = cityById(b.cityId);

  return (
    <View style={{ flex: 1, backgroundColor: SKY.bg }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
          gap: 22,
        }}
      >
        <ScreenHeader
          eyebrow="05 /"
          title={t("same_sky_with", { name: b.name })}
          onBack={nav.pop}
          backLabel={t("back")}
        />

        {!frameA || !frameB || !cmp ? (
          <View style={{ height: 200, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={SKY.fg50} />
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <MiniSky
                name={a.name}
                city={cityA.name}
                when={`${formatDate(birthInstant(a), tag, cityA.tz)} · ${formatTime(birthInstant(a), tag, cityA.tz)}`}
                frame={frameA}
                size={radar}
              />
              <MiniSky
                name={b.name}
                city={cityB.name}
                when={`${formatDate(birthInstant(b), tag, cityB.tz)} · ${formatTime(birthInstant(b), tag, cityB.tz)}`}
                frame={frameB}
                size={radar}
              />
            </View>

            <Panel>
              <SectionLabel>{t("overlap")}</SectionLabel>
              <Fact
                label=""
                value={`${Math.round(cmp.overlap * 100)}%`}
                big
                sub={`${cmp.sharedConstellations.length} / ${
                  cmp.sharedConstellations.length + cmp.onlyA.length + cmp.onlyB.length
                }`}
              />
            </Panel>

            <Panel>
              <SectionLabel>{t("zenith_star")}</SectionLabel>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Fact label={a.name} value={cmp.zenithA?.label ?? "—"} sub={cmp.zenithA?.star.desig} />
                </View>
                <View style={{ flex: 1 }}>
                  <Fact label={b.name} value={cmp.zenithB?.label ?? "—"} sub={cmp.zenithB?.star.desig} />
                </View>
              </View>
              {cmp.zenithSeparationDeg != null ? (
                <MonoText size={10} dim="faint">
                  {t("zenith_sep", { n: cmp.zenithSeparationDeg.toFixed(0) })}
                </MonoText>
              ) : null}
            </Panel>

            <Panel>
              <SectionLabel>{t("rising_east")}</SectionLabel>
              {cmp.sameRising && cmp.risingA ? (
                <Fact
                  label=""
                  value={t("both_rising", { name: constellationName(cmp.risingA, locale) })}
                  big
                />
              ) : (
                <Fact
                  label=""
                  value={t("rising_two", {
                    a: cmp.risingA ? constellationName(cmp.risingA, locale) : "—",
                    b: cmp.risingB ? constellationName(cmp.risingB, locale) : "—",
                  })}
                />
              )}
            </Panel>

            <Panel>
              <SectionLabel>{t("moon")}</SectionLabel>
              <Fact
                label=""
                value={t("moon_two", {
                  a: cmp.moonA ? Math.round(cmp.moonA.illumination * 100) : "—",
                  b: cmp.moonB ? Math.round(cmp.moonB.illumination * 100) : "—",
                })}
                sub={
                  cmp.sameMoonSign && cmp.moonA
                    ? t("same_moon_sign", { sign: zodiacName(cmp.moonA.sign, locale) })
                    : [
                        cmp.moonA ? zodiacName(cmp.moonA.sign, locale) : null,
                        cmp.moonB ? zodiacName(cmp.moonB.sign, locale) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                }
              />
            </Panel>

            <Panel>
              <SectionLabel>{t("shared_constellations")}</SectionLabel>
              <MonoText size={12} dim="soft">
                {cmp.sharedConstellations.length
                  ? cmp.sharedConstellations.map((c) => constellationName(c, locale)).join(" · ")
                  : t("none")}
              </MonoText>
              {cmp.onlyA.length ? (
                <>
                  <Divider />
                  <Fact
                    label={t("only_name", { name: a.name })}
                    value={cmp.onlyA.map((c) => constellationName(c, locale)).join(" · ")}
                  />
                </>
              ) : null}
              {cmp.onlyB.length ? (
                <Fact
                  label={t("only_name", { name: b.name })}
                  value={cmp.onlyB.map((c) => constellationName(c, locale)).join(" · ")}
                />
              ) : null}
            </Panel>

            <Panel>
              <SectionLabel>{t("shared_planets")}</SectionLabel>
              <MonoText size={12} dim="soft">
                {cmp.sharedPlanets.length
                  ? cmp.sharedPlanets.map((p) => bodyName(p, locale)).join(" · ")
                  : t("none")}
              </MonoText>
            </Panel>

            <OutlineButton
              label={t("open_telescope")}
              onPress={() =>
                nav.push({
                  name: "sky",
                  params: { observer: obsB, profileId: b.id },
                })
              }
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function MiniSky({
  name,
  city,
  when,
  frame,
  size,
}: {
  name: string;
  city: string;
  when: string;
  frame: NonNullable<ReturnType<typeof useSkyFrame>>;
  size: number;
}) {
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Canvas style={{ width: size, height: size, alignSelf: "center" }}>
        <OpenSkyRadarGraphic
          frame={frame}
          cx={size / 2}
          cy={size / 2}
          R={size / 2 - 4}
          magLimit={4.0}
          grid={false}
        />
      </Canvas>
      <MonoText size={12} dim="none" medium>
        {name}
      </MonoText>
      <MonoText size={9} dim="faint">
        {city}
      </MonoText>
      <MonoText size={9} dim="muted">
        {when}
      </MonoText>
    </View>
  );
}
