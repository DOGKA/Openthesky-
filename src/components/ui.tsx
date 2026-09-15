import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { MonoText } from "./mono-text";
import { SKY } from "@/lib/theme";

/** Thin-bordered card. */
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [base, { opacity: pressed ? 0.6 : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}

/** Small uppercase section label: "02 / DOĞUM GÖKYÜZÜN". */
export function SectionLabel({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <MonoText size={10} dim="faint" upper>
      {index ? `${index} / ` : ""}
      {children}
    </MonoText>
  );
}

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
          alignItems: "center",
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

/** Back chevron + eyebrow + title. */
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

/** label / value pair used for facts. */
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

export function Divider() {
  return <View style={{ height: 1, backgroundColor: SKY.fg12 }} />;
}
