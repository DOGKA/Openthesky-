import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import { formatCount, usePresenceCount } from "@/hooks/use-presence-count";
import { useLocale } from "@/providers/locale-provider";

export function LiveCounter({ compact = false }: { compact?: boolean }) {
  const { t, tag } = useLocale();
  const presence = usePresenceCount();
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 1400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const live = presence ? formatCount(presence.live, tag) : "—";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Animated.View
        style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: SKY.accent }, dotStyle]}
      />
      <MonoText size={compact ? 10 : 11} dim={compact ? "muted" : "soft"}>
        {t("live_watching", { n: live })}
      </MonoText>
    </View>
  );
}
