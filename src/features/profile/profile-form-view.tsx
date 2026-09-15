import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MonoText } from "@/components/mono-text";
import { OutlineButton, ScreenHeader } from "@/components/ui";
import { SKY } from "@/theme";
import { CITIES, useProfiles, type BirthProfile } from "@/profiles";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import { FormField } from "./form-field";

export function ProfileFormView({ profileId }: { profileId?: string }) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const nav = useNavigation();
  const { byId, upsert, remove, me } = useProfiles();
  const existing = profileId ? byId(profileId) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [date, setDate] = useState(existing?.date ?? "1997-06-08");
  const [time, setTime] = useState(existing?.time ?? "12:00");
  const [cityId, setCityId] = useState(existing?.cityId ?? "ist");
  const canSave = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time);
  const id = useMemo(() => existing?.id ?? `p-${Date.now().toString(36)}`, [existing]);

  const save = () => {
    const next: BirthProfile = {
      id,
      name: name.trim(),
      date,
      time,
      cityId,
      isMe: existing?.isMe,
    };
    upsert(next);
    nav.pop();
  };

  return (
    <View style={{ flex: 1, backgroundColor: SKY.bg }}>
      <StatusBar style="light" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
          gap: 18,
        }}
      >
        <ScreenHeader
          eyebrow={existing?.isMe ? "02 /" : "03 /"}
          title={t("profile_title")}
          onBack={nav.pop}
          backLabel={t("back")}
        />
        <FormField label={t("name")} value={name} onChange={setName} />
        <FormField label={t("date")} value={date} onChange={setDate} keyboard="numbers-and-punctuation" />
        <FormField label={t("time")} value={time} onChange={setTime} keyboard="numbers-and-punctuation" />
        <MonoText size={9} dim="faint" upper>
          {t("city")}
        </MonoText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CITIES.map((c) => {
            const active = c.id === cityId;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCityId(c.id)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: active ? SKY.fg50 : SKY.fg12,
                  backgroundColor: active ? SKY.fg06 : "transparent",
                  borderRadius: 4,
                }}
              >
                <MonoText size={10} dim={active ? "none" : "muted"}>
                  {c.name}
                </MonoText>
              </Pressable>
            );
          })}
        </View>
        <OutlineButton label={t("save")} onPress={save} primary disabled={!canSave} />
        {existing && !existing.isMe && existing.id !== me.id ? (
          <OutlineButton
            label={t("delete")}
            onPress={() => {
              remove(existing.id);
              nav.reset({ name: "home" });
            }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
