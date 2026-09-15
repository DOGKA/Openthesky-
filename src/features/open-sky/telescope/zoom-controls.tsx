import { Pressable, View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import { FOV_MAX, FOV_MIN } from "./types";

export function ZoomControls({
  fovDeg,
  onZoomIn,
  onZoomOut,
}: {
  fovDeg: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", right: 16, top: "42%", gap: 8 }}
    >
      <ZoomButton label="+" onPress={onZoomIn} disabled={fovDeg <= FOV_MIN + 0.05} />
      <ZoomButton label="−" onPress={onZoomOut} disabled={fovDeg >= FOV_MAX - 0.05} />
    </View>
  );
}

function ZoomButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: SKY.fg22,
        backgroundColor: SKY.fg06,
        borderRadius: 4,
        opacity: disabled ? 0.28 : pressed ? 0.5 : 1,
      })}
    >
      <MonoText size={18} dim="soft" medium>
        {label}
      </MonoText>
    </Pressable>
  );
}
