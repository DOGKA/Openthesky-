import { useState } from "react";
import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import type { BirthProfile } from "@/profiles";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import { ProfileCard } from "./profile-card";

const GAP = 12;
const PEEK = 28;

export function FriendsCarousel({ me, friends }: { me: BirthProfile; friends: BirthProfile[] }) {
  const { width } = useWindowDimensions();
  const { t } = useLocale();
  const nav = useNavigation();
  const cardW = Math.max(240, width - 40 - PEEK);
  const page = cardW + GAP;
  const [index, setIndex] = useState(0);
  const pages = friends.length + 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / page);
    setIndex(Math.max(0, Math.min(pages - 1, i)));
  };

  return (
    <View style={{ gap: 12, marginHorizontal: -20 }}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={page}
        snapToAlignment="start"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
      >
        {friends.map((f) => (
          <View key={f.id} style={{ width: cardW, marginRight: GAP }}>
            <ProfileCard
              profile={f}
              onOpen={() => nav.push({ name: "birth-sky", params: { profileId: f.id } })}
              onEdit={() => nav.push({ name: "profile-form", params: { profileId: f.id } })}
              editLabel={t("edit")}
              action={{
                label: t("same_sky"),
                onPress: () => nav.push({ name: "compat", params: { aId: me.id, bId: f.id } }),
              }}
            />
          </View>
        ))}
        <Pressable
          onPress={() => nav.push({ name: "profile-form", params: {} })}
          style={({ pressed }) => ({
            width: cardW,
            minHeight: 128,
            borderWidth: 1,
            borderColor: SKY.fg12,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <MonoText size={18} dim="soft">
            +
          </MonoText>
          <MonoText size={10} dim="muted" upper>
            {t("add_friend")}
          </MonoText>
        </Pressable>
      </ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        {Array.from({ length: pages }, (_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 12 : 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: i === index ? SKY.fg50 : SKY.fg22,
            }}
          />
        ))}
      </View>
    </View>
  );
}
