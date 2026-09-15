import { ActivityIndicator, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "@/components/ui";
import { SKY } from "@/theme";
import { formatDate, formatTime } from "@/format";
import { birthInstant, birthObserver, cityById, useProfiles } from "@/profiles";
import { compareSkies } from "@/sky/insights";
import { useSkyFrame } from "@/sky/use-sky-frame";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import { MiniSky } from "./mini-sky";
import { SameSkyFacts } from "./same-sky-facts";

export function SameSkyView({ aId, bId }: { aId: string; bId: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { tag, t } = useLocale();
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
            <SameSkyFacts cmp={cmp} a={a} b={b} obsB={obsB} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
