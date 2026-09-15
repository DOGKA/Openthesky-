import { View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { Fact, OutlineButton, Panel, SectionLabel } from "@/components/ui";
import { bodyName, constellationName, zodiacName, type SkyComparison } from "@/sky/insights";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import type { BirthProfile, Observer } from "@/profiles";
import { SharedConstellations } from "./shared-constellations";

export function SameSkyFacts({
  cmp,
  a,
  b,
  obsB,
}: {
  cmp: SkyComparison;
  a: BirthProfile;
  b: BirthProfile;
  obsB: Observer;
}) {
  const { locale, t } = useLocale();
  const nav = useNavigation();

  return (
    <>
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
          <Fact label="" value={t("both_rising", { name: constellationName(cmp.risingA, locale) })} big />
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
              : [cmp.moonA ? zodiacName(cmp.moonA.sign, locale) : null, cmp.moonB ? zodiacName(cmp.moonB.sign, locale) : null]
                  .filter(Boolean)
                  .join(" · ")
          }
        />
      </Panel>
      <SharedConstellations cmp={cmp} aName={a.name} bName={b.name} />
      <Panel>
        <SectionLabel>{t("shared_planets")}</SectionLabel>
        <MonoText size={12} dim="soft">
          {cmp.sharedPlanets.length ? cmp.sharedPlanets.map((p) => bodyName(p, locale)).join(" · ") : t("none")}
        </MonoText>
      </Panel>
      <OutlineButton
        label={t("open_telescope")}
        onPress={() => nav.push({ name: "sky", params: { observer: obsB, profileId: b.id } })}
      />
    </>
  );
}
