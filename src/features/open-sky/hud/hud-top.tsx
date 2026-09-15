import { Pressable, View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import type { TFn } from "@/i18n";

export function HudTopBar({
  t,
  live,
  onBack,
  onToggleLive,
  caption,
  topInset,
}: {
  t: TFn;
  live: boolean;
  onBack: () => void;
  onToggleLive?: () => void;
  caption: string;
  topInset: number;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: topInset + 8,
        left: 16,
        right: 16,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={({ pressed }) => ({
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderWidth: 1,
          borderColor: SKY.fg22,
          borderRadius: 4,
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <MonoText size={10} dim="soft" upper>
          ← {t("grid")}
        </MonoText>
      </Pressable>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        {onToggleLive ? (
          <Pressable
            onPress={onToggleLive}
            hitSlop={8}
            style={({ pressed }) => ({
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderWidth: 1,
              borderColor: live ? SKY.accent : SKY.fg22,
              backgroundColor: live ? "rgba(159,180,255,0.12)" : "transparent",
              borderRadius: 4,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <MonoText size={10} dim={live ? "none" : "soft"} upper style={live ? { color: SKY.accent } : undefined}>
              {live ? t("live_on") : t("live")}
            </MonoText>
          </Pressable>
        ) : (
          <MonoText size={10} dim="muted" upper>
            {t("title")}
          </MonoText>
        )}
        <MonoText size={10} dim="faint" upper>
          {caption}
        </MonoText>
      </View>
    </View>
  );
}
