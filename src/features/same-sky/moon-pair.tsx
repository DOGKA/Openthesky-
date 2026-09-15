import { View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { Divider, Panel, SectionLabel } from "@/components/ui";
import { BodyGlyph, ZodiacMark } from "@/components/sky-glyph";
import { zodiacName, type SkyComparison } from "@/sky/insights";
import { useLocale } from "@/providers/locale-provider";

export function MoonPair({
  cmp,
  aName,
  bName,
}: {
  cmp: SkyComparison;
  aName: string;
  bName: string;
}) {
  const { locale, t } = useLocale();
  const sides = [
    { moon: cmp.moonA, name: aName },
    { moon: cmp.moonB, name: bName },
  ];

  return (
    <Panel>
      <SectionLabel>{t("moon")}</SectionLabel>
      <View style={{ flexDirection: "row", gap: 16 }}>
        {sides.map(({ moon, name }) => (
          <View key={name} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
            {moon ? (
              <BodyGlyph
                id="lun"
                kind="moon"
                illumination={moon.illumination}
                waning={!moon.waxing}
                size={34}
              />
            ) : null}
            <View style={{ flex: 1 }}>
              <MonoText size={15} dim="none" medium tracking={0.2}>
                {moon ? `${Math.round(moon.illumination * 100)}%` : "—"}
              </MonoText>
              <MonoText size={9} dim="faint" upper tracking={0.6} numberOfLines={1}>
                {name}
              </MonoText>
            </View>
          </View>
        ))}
      </View>
      {cmp.moonA || cmp.moonB ? (
        <>
          <Divider />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ZodiacMark size={22} />
            <MonoText size={11} dim="soft" style={{ flex: 1 }}>
              {cmp.sameMoonSign && cmp.moonA
                ? t("same_moon_sign", { sign: zodiacName(cmp.moonA.sign, locale) })
                : [cmp.moonA, cmp.moonB]
                    .map((m) => (m ? zodiacName(m.sign, locale) : "—"))
                    .join(" · ")}
            </MonoText>
          </View>
        </>
      ) : null}
    </Panel>
  );
}
