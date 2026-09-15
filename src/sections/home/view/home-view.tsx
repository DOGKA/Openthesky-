import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Canvas } from "@shopify/react-native-skia";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeIn } from "react-native-reanimated";
import { MonoText } from "@/components/mono-text";
import { Divider, OutlineButton, Panel, SectionLabel } from "@/components/ui";
import { SKY } from "@/lib/theme";
import { useNow } from "@/hooks/use-now";
import { useSkyFrame } from "@/lib/sky/use-sky-frame";
import { cityById, type BirthProfile } from "@/lib/profiles";
import { formatDateTime, formatLatLon, formatTime } from "@/lib/format";
import { useLocale } from "@/providers/locale-provider";
import { useProfiles } from "@/lib/profiles";
import { useDeviceLocation } from "@/providers/device-location-provider";
import { useNavigation } from "@/navigation/navigator";
import { OpenSkyRadarGraphic } from "@/sections/open-sky/open-sky-radar-graphic";
import { LiveCounter } from "../live-counter";

/**
 * Prototype home: live counter, the sky right now (→ grid), your birth sky and
 * your friends' profiles. In Astrolic these blocks map onto the home feed and
 * the friend profile screen.
 */
export function HomeView() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, tag } = useLocale();
  const nav = useNavigation();
  const { me, friends } = useProfiles();
  const device = useDeviceLocation();

  const now = useNow(60000);
  const frame = useSkyFrame(
    device.location?.latitude ?? null,
    device.location?.longitude ?? null,
    now
  );

  const cardSize = Math.min(width - 40 - 32, 260);

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
        {/* header */}
        <View style={{ gap: 12 }}>
          <MonoText size={10} dim="faint" upper tracking={2}>
            {t("home_eyebrow")}
          </MonoText>
          <MonoText size={26} dim="none" medium tracking={-0.2}>
            {t("home_title")}
          </MonoText>
          <LiveCounter />
        </View>

        {/* the sky right now */}
        <View style={{ gap: 10 }}>
          <SectionLabel index="01">{t("now_sky")}</SectionLabel>
          <Panel onPress={device.location ? () => nav.push({ name: "sky", params: {} }) : undefined}>
            {frame && device.location ? (
              <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center", gap: 12 }}>
                <Canvas style={{ width: cardSize, height: cardSize }}>
                  <OpenSkyRadarGraphic
                    frame={frame}
                    cx={cardSize / 2}
                    cy={cardSize / 2}
                    R={cardSize / 2 - 6}
                    magLimit={4.0}
                    grid={false}
                  />
                </Canvas>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch" }}>
                  <MonoText size={9} dim="faint">
                    {formatTime(now, tag)} {t("local")} · {formatLatLon(device.location.latitude, device.location.longitude)}
                  </MonoText>
                  <MonoText size={9} dim="faint" upper>
                    {t("now_sky_hint")}
                  </MonoText>
                </View>
              </Animated.View>
            ) : (
              <View style={{ gap: 12 }}>
                <MonoText size={12} dim="soft">
                  {t("loc_body")}
                </MonoText>
                {device.status === "denied" || device.status === "unavailable" ? (
                  <View style={{ gap: 8 }}>
                    <OutlineButton label={t("loc_retry")} onPress={device.retry} />
                    <OutlineButton label={t("loc_fallback")} onPress={device.useFallback} />
                  </View>
                ) : (
                  <OutlineButton
                    label={device.status === "requesting" ? t("loc_requesting") : t("loc_button")}
                    onPress={device.request}
                    primary
                    disabled={device.status === "requesting" || device.status === "checking"}
                  />
                )}
              </View>
            )}
          </Panel>
        </View>

        {/* your birth sky */}
        <View style={{ gap: 10 }}>
          <SectionLabel index="02">{t("birth_sky")}</SectionLabel>
          <ProfileCard
            profile={me}
            onOpen={() => nav.push({ name: "birth-sky", params: { profileId: me.id } })}
            onEdit={() => nav.push({ name: "profile-form", params: { profileId: me.id } })}
            editLabel={t("edit")}
          />
        </View>

        {/* friends */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <SectionLabel index="03">{t("friends")}</SectionLabel>
            <Pressable onPress={() => nav.push({ name: "profile-form", params: {} })} hitSlop={8}>
              <MonoText size={10} dim="soft" upper>
                + {t("add_friend")}
              </MonoText>
            </Pressable>
          </View>
          {friends.map((f) => (
            <ProfileCard
              key={f.id}
              profile={f}
                onOpen={() => nav.push({ name: "birth-sky", params: { profileId: f.id } })}
              onEdit={() => nav.push({ name: "profile-form", params: { profileId: f.id } })}
              editLabel={t("edit")}
              action={{
                label: t("same_sky"),
                onPress: () => nav.push({ name: "compat", params: { aId: me.id, bId: f.id } }),
              }}
            />
          ))}
        </View>

        <Divider />
        <MonoText size={9} dim="faint">
          {formatDateTime(now, tag)}
        </MonoText>
      </ScrollView>
    </View>
  );
}

function ProfileCard({
  profile,
  onOpen,
  onEdit,
  editLabel,
  action,
}: {
  profile: BirthProfile;
  onOpen: () => void;
  onEdit: () => void;
  editLabel: string;
  action?: { label: string; onPress: () => void };
}) {
  const { t } = useLocale();
  const city = cityById(profile.cityId);
  const when = `${profile.date} · ${profile.time}`;
  return (
    <Panel onPress={onOpen}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ gap: 4, flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MonoText size={15} dim="none" medium>
              {profile.name}
            </MonoText>
            {profile.id === "anil" ? (
              <MonoText size={9} dim="faint" upper>
                {t("example")}
              </MonoText>
            ) : null}
          </View>
          <MonoText size={10} dim="muted">
            {when}
          </MonoText>
          <MonoText size={10} dim="muted">
            {city.name}, {city.country} · {formatLatLon(city.latitude, city.longitude)}
          </MonoText>
        </View>
        <Pressable onPress={onEdit} hitSlop={10}>
          <MonoText size={9} dim="faint" upper>
            {editLabel}
          </MonoText>
        </Pressable>
      </View>
      {action ? (
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Pressable onPress={action.onPress} hitSlop={8} style={{ paddingVertical: 4 }}>
            <MonoText size={10} dim="soft" upper tracking={1}>
              {action.label} →
            </MonoText>
          </Pressable>
        </View>
      ) : null}
    </Panel>
  );
}
