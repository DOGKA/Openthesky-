import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MonoText } from "@/components/mono-text";
import { Divider, SectionLabel } from "@/components/ui";
import { SKY } from "@/theme";
import { formatDateTime } from "@/format";
import { useNow } from "@/hooks/use-now";
import { useProfiles } from "@/profiles";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import { LiveCounter } from "./live-counter";
import { LanguageSwitcher } from "./language-switcher";
import { NowSkyCard } from "./now-sky-card";
import { ProfileCard } from "./profile-card";
import { FriendsCarousel } from "./friends-carousel";

export function HomeView() {
  const insets = useSafeAreaInsets();
  const { t, tag } = useLocale();
  const nav = useNavigation();
  const { me, friends } = useProfiles();
  const now = useNow(60000);

  return (
    <View style={{ flex: 1, backgroundColor: SKY.bg }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
          gap: 28,
        }}
      >
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <MonoText size={10} dim="faint" upper tracking={2}>
              {t("home_eyebrow")}
            </MonoText>
            <LanguageSwitcher />
          </View>
          <MonoText size={26} dim="none" medium tracking={-0.2}>
            {t("home_title")}
          </MonoText>
          <LiveCounter />
        </View>
        <NowSkyCard />
        <View style={{ gap: 10 }}>
          <SectionLabel index="02">{t("birth_sky")}</SectionLabel>
          <ProfileCard
            profile={me}
            onOpen={() => nav.push({ name: "birth-sky", params: { profileId: me.id } })}
            onEdit={() => nav.push({ name: "profile-form", params: { profileId: me.id } })}
            editLabel={t("edit")}
          />
        </View>
        <View style={{ gap: 10 }}>
          <SectionLabel index="03">{t("friends")}</SectionLabel>
          <FriendsCarousel me={me} friends={friends} />
        </View>
        <Divider />
        <MonoText size={9} dim="faint">
          {formatDateTime(now, tag)}
        </MonoText>
      </ScrollView>
    </View>
  );
}
