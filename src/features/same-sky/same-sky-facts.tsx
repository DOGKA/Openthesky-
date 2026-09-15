import { View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { Fact, OutlineButton, Panel, SectionLabel } from "@/components/ui";
import { ConstellationGlyph } from "@/components/sky-glyph";
import { constellationName, type SkyComparison } from "@/sky/insights";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import type { BirthProfile, Observer } from "@/profiles";
import { MoonPair } from "./moon-pair";
import { SharedConstellations } from "./shared-constellations";
import { SharedPlanets } from "./shared-planets";

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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ConstellationGlyph id={cmp.risingA.id} size={38} />
            <View style={{ flex: 1 }}>
              <Fact label="" value={t("both_rising", { name: constellationName(cmp.risingA, locale) })} big />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 16 }}>
            {[
              { c: cmp.risingA, name: a.name },
              { c: cmp.risingB, name: b.name },
            ].map(({ c, name }) => (
              <View key={name} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
                {c ? <ConstellationGlyph id={c.id} size={32} /> : null}
                <View style={{ flex: 1 }}>
                  <Fact label={name} value={c ? constellationName(c, locale) : "—"} />
                </View>
              </View>
            ))}
          </View>
        )}
      </Panel>
      <MoonPair cmp={cmp} aName={a.name} bName={b.name} />
      <SharedConstellations cmp={cmp} aName={a.name} bName={b.name} />
      <SharedPlanets bodies={cmp.sharedPlanets} />
      <OutlineButton
        label={t("open_telescope")}
        onPress={() => nav.push({ name: "sky", params: { observer: obsB, profileId: b.id } })}
      />
    </>
  );
}
