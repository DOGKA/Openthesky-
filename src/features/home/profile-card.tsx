import { Pressable, View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { Panel } from "@/components/ui";
import { cityById, type BirthProfile } from "@/profiles";
import { formatLatLon } from "@/format";
import { useLocale } from "@/providers/locale-provider";

export function ProfileCard({
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
  return (
    <Panel onPress={onOpen}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ gap: 4, flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MonoText size={15} dim="none" medium>
              {profile.name}
            </MonoText>
            {profile.example ? (
              <MonoText size={9} dim="faint" upper>
                {t("example")}
              </MonoText>
            ) : null}
          </View>
          <MonoText size={10} dim="muted">
            {profile.date} · {profile.time}
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
