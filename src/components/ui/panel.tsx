import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";

export function Panel({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const base: ViewStyle = {
    borderWidth: 1,
    borderColor: SKY.fg12,
    borderRadius: 6,
    padding: 16,
    gap: 10,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.6 : 1 }, style]}>
      {children}
    </Pressable>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: SKY.fg12 }} />;
}

export function SectionLabel({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <MonoText size={10} dim="faint" upper>
      {index ? `${index} / ` : ""}
      {children}
    </MonoText>
  );
}
