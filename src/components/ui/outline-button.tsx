import { Pressable, type ViewStyle } from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";

export function OutlineButton({
  label,
  onPress,
  primary = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        {
          paddingVertical: 11,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: primary ? SKY.fg50 : SKY.fg22,
          backgroundColor: primary ? SKY.fg06 : "transparent",
          borderRadius: 4,
          alignItems: "center" as const,
          opacity: disabled ? 0.35 : pressed ? 0.5 : 1,
        },
        style,
      ]}
    >
      <MonoText size={10} dim={primary ? "none" : "soft"} upper tracking={1}>
        {label}
      </MonoText>
    </Pressable>
  );
}
