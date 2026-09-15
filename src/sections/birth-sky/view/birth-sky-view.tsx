import { ActivityIndicator, ScrollView, View, useWindowDimensions } from "react-native";
import { Canvas } from "@shopify/react-native-skia";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MonoText } from "@/components/mono-text";
import { Divider, Fact, OutlineButton, Panel, ScreenHeader, SectionLabel } from "@/components/ui";
import { SKY } from "@/lib/theme";
import { formatDate, formatLatLon, formatLightYears, formatLst, formatTime } from "@/lib/format";
import { useProfiles } from "@/lib/profiles";
import { bodyName, constellationName, zodiacName } from "@/lib/sky/sky-insights";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import { OpenSkyRadarGraphic } from "@/sections/open-sky/open-sky-radar-graphic";
import { useBirthSky } from "../use-birth-sky";

/**
 * Birth sky for a profile (yours or a friend's): radar of that minute plus the
 * personal facts — star overhead, what was rising, Moon, planets, and the
 * light-year star.
 */
export function BirthSkyView({ profileId }: { profileId: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { locale, tag, t } = useLocale();
  const nav = useNavigation();
  const { byId, me } = useProfiles();
  const profile = byId(profileId) ?? me;

  const label = `${profile.name} · ${t("birth_moment")}`;
  const { observer, city, frame, facts } = useBirthSky(profile, label);

  const radarSize = Math.min(width - 40, 320);
  const title = profile.isMe ? t("birth_sky") : t("birth_sky_of", { name: profile.name });

  return (
    <View style={{ flex: 1, backgroundColor: SKY.bg }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
          gap: 24,
        }}
      >
        <ScreenHeader
          eyebrow={`02 / ${t("poster_title")}`}
          title={title}
          onBack={nav.pop}
          backLabel={t("back")}
        />

        <View style={{ gap: 4 }}>
          <MonoText size={12} dim="soft">
            {formatDate(observer.date!, tag, city.tz)} · {formatTime(observer.date!, tag, city.tz)}
          </MonoText>
          <MonoText size={10} dim="muted">
            {city.name}, {city.country} · {formatLatLon(city.latitude, city.longitude)}
            {frame ? ` · LST ${formatLst(frame.lstDeg)}` : ""}
          </MonoText>
        </View>

        {!frame || !facts ? (
          <View style={{ height: radarSize, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={SKY.fg50} />
          </View>
        ) : (
          <>
            <View style={{ alignItems: "center" }}>
              <Canvas style={{ width: radarSize, height: radarSize }}>
                <OpenSkyRadarGraphic
                  frame={frame}
                  cx={radarSize / 2}
                  cy={radarSize / 2}
                  R={radarSize / 2 - 10}
                  magLimit={4.5}
                />
              </Canvas>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <OutlineButton
                label={t("open_telescope")}
                onPress={() => nav.push({ name: "sky", params: { observer, profileId: profile.id } })}
                style={{ flex: 1 }}
              />
              <OutlineButton
                label={t("share_story")}
                onPress={() => nav.push({ name: "poster", params: { profileId: profile.id } })}
                primary
                style={{ flex: 1 }}
              />
            </View>

            {/* zenith star */}
            <Panel>
              <SectionLabel>{t("zenith_star")}</SectionLabel>
              {facts.zenith ? (
                <>
                  <Fact
                    label={facts.zenith.star.desig ?? ""}
                    value={facts.zenith.label}
                    big
                    sub={[
                      facts.zenithConstellation ? constellationName(facts.zenithConstellation, locale) : null,
                      `${t("mag")} ${facts.zenith.star.mag.toFixed(2)}`,
                      facts.zenith.star.ly ? t("light_years", { n: formatLightYears(facts.zenith.star.ly) }) : null,
                      t("from_zenith", { n: facts.zenith.fromZenithDeg.toFixed(1) }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                  <MonoText size={10} dim="faint">
                    {t("zenith_star_hint")}
                  </MonoText>
                </>
              ) : (
                <MonoText size={12} dim="muted">
                  —
                </MonoText>
              )}
            </Panel>

            {/* rising / moon / planets */}
            <Panel>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Fact
                    label={t("rising_east")}
                    value={facts.rising ? constellationName(facts.rising, locale) : "—"}
                    sub={facts.rising?.id.toUpperCase()}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Fact
                    label={t("moon")}
                    value={facts.moon ? `${Math.round(facts.moon.illumination * 100)}%` : "—"}
                    sub={
                      facts.moon
                        ? `${facts.moon.waxing ? t("waxing") : t("waning")} · ${zodiacName(facts.moon.sign, locale)} · ${
                            facts.moon.aboveHorizon ? t("above_horizon") : t("below_horizon")
                          }`
                        : undefined
                    }
                  />
                </View>
              </View>
              <Divider />
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Fact
                    label={t("planets_above")}
                    value={
                      facts.planetsAbove.length
                        ? facts.planetsAbove.map((b) => bodyName(b, locale)).join(", ")
                        : t("none")
                    }
                  />
                </View>
                <View style={{ width: 90 }}>
                  <Fact label="" value={facts.night ? t("night") : t("day")} />
                </View>
              </View>
            </Panel>

            {/* light-year star */}
            {facts.lightYear ? (
              <Panel>
                <SectionLabel>{t("light_year_star")}</SectionLabel>
                <Fact
                  label={t("age_years", { n: Math.floor(facts.ageYears) })}
                  value={facts.lightYear.name ?? facts.lightYear.desig ?? ""}
                  big
                  sub={`${facts.lightYear.desig ?? ""} · ${t("light_years", { n: formatLightYears(facts.lightYear.ly) })}`}
                />
                <MonoText size={11} dim="muted">
                  {t("light_year_star_body", {
                    star: facts.lightYear.name ?? facts.lightYear.desig ?? "",
                    ly: formatLightYears(facts.lightYear.ly),
                  })}
                </MonoText>
              </Panel>
            ) : null}

            {!profile.isMe ? (
              <OutlineButton
                label={t("same_sky_with", { name: profile.name })}
                onPress={() => nav.push({ name: "compat", params: { aId: me.id, bId: profile.id } })}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
