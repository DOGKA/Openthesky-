import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MonoText } from "@/components/mono-text";
import { OutlineButton, ScreenHeader } from "@/components/ui";
import { SKY, MONO } from "@/lib/theme";
import { CITIES, useProfiles, type BirthProfile } from "@/lib/profiles";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";

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

  const id = useMemo(
    () => existing?.id ?? `p-${Date.now().toString(36)}`,
    [existing]
  );

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

        <Field label={t("name")} value={name} onChange={setName} />
        <Field label={t("date")} value={date} onChange={setDate} keyboard="numbers-and-punctuation" />
        <Field label={t("time")} value={time} onChange={setTime} keyboard="numbers-and-punctuation" />

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

function Field({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: "numbers-and-punctuation";
}) {
  return (
    <View style={{ gap: 6 }}>
      <MonoText size={9} dim="faint" upper>
        {label}
      </MonoText>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard ?? "default"}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={SKY.fg35}
        style={{
          fontFamily: MONO,
          fontSize: 16,
          color: SKY.fg,
          borderWidth: 1,
          borderColor: SKY.fg22,
          borderRadius: 4,
          paddingVertical: 12,
          paddingHorizontal: 12,
        }}
      />
    </View>
  );
}
