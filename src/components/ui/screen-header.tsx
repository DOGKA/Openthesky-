import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { MonoText } from "@/components/mono-text";

export function ScreenHeader({
  eyebrow,
  title,
  onBack,
  backLabel,
  right,
}: {
  eyebrow?: string;
  title: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={{ alignSelf: "flex-start" }}>
          <MonoText size={10} dim="soft" upper>
            ← {backLabel ?? ""}
          </MonoText>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View style={{ gap: 4, flex: 1 }}>
          {eyebrow ? (
            <MonoText size={10} dim="faint" upper>
              {eyebrow}
            </MonoText>
          ) : null}
          <MonoText size={18} dim="none" medium tracking={0.2}>
            {title}
          </MonoText>
        </View>
        {right}
      </View>
    </View>
  );
}
