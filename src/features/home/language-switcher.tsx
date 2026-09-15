import { Pressable, View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n";
import { useLocale } from "@/providers/locale-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {LOCALES.map((code) => (
        <LangChip key={code} code={code} active={code === locale} onPress={() => setLocale(code)} />
      ))}
    </View>
  );
}

function LangChip({
  code,
  active,
  onPress,
}: {
  code: Locale;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: active ? SKY.fg50 : SKY.fg12,
        backgroundColor: active ? SKY.fg06 : "transparent",
        borderRadius: 3,
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <MonoText size={9} dim={active ? "none" : "faint"} upper tracking={0.8}>
        {LOCALE_LABELS[code]}
      </MonoText>
    </Pressable>
  );
}
