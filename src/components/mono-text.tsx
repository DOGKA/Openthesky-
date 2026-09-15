import { Text, type TextProps, StyleSheet } from "react-native";
import { MONO, MONO_MEDIUM, SKY } from "@/theme";

type Props = TextProps & {
  size?: number;
  dim?: "none" | "soft" | "muted" | "faint";
  medium?: boolean;
  /** letter spacing in px; defaults to a light technical tracking */
  tracking?: number;
  upper?: boolean;
};

const DIM_COLOR = {
  none: SKY.fg,
  soft: SKY.fg70,
  muted: SKY.fg50,
  faint: SKY.fg35,
} as const;

/** Monospace label used for every piece of HUD / grid typography. */
export function MonoText({
  size = 11,
  dim = "soft",
  medium = false,
  tracking = 0.6,
  upper = false,
  style,
  children,
  ...rest
}: Props) {
  return (
    <Text
      {...rest}
      allowFontScaling={false}
      style={[
        styles.base,
        {
          fontFamily: medium ? MONO_MEDIUM : MONO,
          fontSize: size,
          lineHeight: Math.round(size * 1.35),
          color: DIM_COLOR[dim],
          letterSpacing: tracking,
          textTransform: upper ? "uppercase" : "none",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontVariant: ["tabular-nums"],
  },
});
