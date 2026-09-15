import { View } from "react-native";
import { Canvas } from "@shopify/react-native-skia";
import { MonoText } from "@/components/mono-text";
import { Divider, Fact, OutlineButton, Panel, SectionLabel } from "@/components/ui";
import { formatLightYears } from "@/format";
import { bodyName, constellationName, zodiacName } from "@/sky/insights";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import { OpenSkyRadarGraphic } from "@/features/open-sky/radar/radar-graphic";
import { useProfiles, type Observer } from "@/profiles";
import type { SkyFrame } from "@/sky/frame";
import type { BirthSkyFacts } from "./use-birth-sky";

export function BirthSkyFactsList({
  facts,
  frame,
  observer,
  profileId,
  isMe,
  name,
  radarSize,
}: {
  facts: BirthSkyFacts;
  frame: SkyFrame;
  observer: Observer;
  profileId: string;
  isMe?: boolean;
  name: string;
  radarSize: number;
}) {
  const { locale, t } = useLocale();
  const nav = useNavigation();
  const { me } = useProfiles();

  return (
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
          onPress={() => nav.push({ name: "sky", params: { observer, profileId } })}
          style={{ flex: 1 }}
        />
        <OutlineButton
          label={t("share_story")}
          onPress={() => nav.push({ name: "poster", params: { profileId } })}
          primary
          style={{ flex: 1 }}
        />
      </View>
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
      {!isMe ? (
        <OutlineButton
          label={t("same_sky_with", { name })}
          onPress={() => nav.push({ name: "compat", params: { aId: me.id, bId: profileId } })}
        />
      ) : null}
    </>
  );
}
