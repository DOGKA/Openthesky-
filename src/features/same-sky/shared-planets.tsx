import { View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { Panel, SectionLabel } from "@/components/ui";
import { BodyGlyph } from "@/components/sky-glyph";
import { SKY } from "@/theme";
import type { FrameBody } from "@/sky/frame";
import { bodyName } from "@/sky/insights";
import { useLocale } from "@/providers/locale-provider";

export function SharedPlanets({ bodies }: { bodies: FrameBody[] }) {
  const { locale, t } = useLocale();

  return (
    <Panel>
      <SectionLabel>{t("shared_planets")}</SectionLabel>
      {bodies.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {bodies.map((b) => (
            <View
              key={b.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 32,
                paddingLeft: 5,
                paddingRight: 9,
                borderWidth: 1,
                borderColor: SKY.fg22,
                backgroundColor: SKY.fg06,
                borderRadius: 3,
              }}
            >
              <BodyGlyph id={b.id} kind={b.kind} illumination={b.illumination} size={22} />
              <MonoText size={10} dim="soft">
                {bodyName(b, locale)}
              </MonoText>
            </View>
          ))}
        </View>
      ) : (
        <MonoText size={12} dim="muted">
          {t("none")}
        </MonoText>
      )}
    </Panel>
  );
}
