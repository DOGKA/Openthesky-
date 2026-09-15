import { ActivityIndicator, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MonoText } from "@/components/mono-text";
import { ScreenHeader } from "@/components/ui";
import { SKY } from "@/theme";
import { formatDate, formatLatLon, formatLst, formatTime } from "@/format";
import { useProfiles } from "@/profiles";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import { BirthSkyFactsList } from "./birth-sky-facts";
import { useBirthSky } from "./use-birth-sky";

export function BirthSkyView({ profileId }: { profileId: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { tag, t } = useLocale();
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
        <ScreenHeader eyebrow={`02 / ${t("poster_title")}`} title={title} onBack={nav.pop} backLabel={t("back")} />
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
          <BirthSkyFactsList
            facts={facts}
            frame={frame}
            observer={observer}
            profileId={profile.id}
            isMe={profile.isMe}
            name={profile.name}
            radarSize={radarSize}
          />
        )}
      </ScrollView>
    </View>
  );
}
