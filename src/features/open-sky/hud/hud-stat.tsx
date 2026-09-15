import { View } from "react-native";
import { MonoText } from "@/components/mono-text";

export function HudStat({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "center" | "right";
}) {
  const alignItems = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  return (
    <View style={{ alignItems, gap: 1 }}>
      <MonoText size={9} dim="faint" upper>
        {label}
      </MonoText>
      <MonoText size={13} dim="soft" medium tracking={0.3}>
        {value}
      </MonoText>
    </View>
  );
}
