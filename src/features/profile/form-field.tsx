import { View, TextInput } from "react-native";
import { MonoText } from "@/components/mono-text";
import { MONO, SKY } from "@/theme";

export function FormField({
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
