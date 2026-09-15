import { View } from "react-native";
import { MonoText } from "@/components/mono-text";

export function Fact({
  label,
  value,
  sub,
  big = false,
}: {
  label: string;
  value: string;
  sub?: string;
  big?: boolean;
}) {
  return (
    <View style={{ gap: 3 }}>
      <MonoText size={9} dim="faint" upper>
        {label}
      </MonoText>
      <MonoText size={big ? 20 : 13} dim="none" medium tracking={0.2}>
        {value}
      </MonoText>
      {sub ? (
        <MonoText size={10} dim="muted">
          {sub}
        </MonoText>
      ) : null}
    </View>
  );
}
