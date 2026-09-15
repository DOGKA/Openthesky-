import { Group, Line, vec } from "@shopify/react-native-skia";
import { SKY } from "@/theme";

export function CornerBrackets({ width, height }: { width: number; height: number }) {
  const inset = 14;
  const len = 12;
  const c = SKY.fg22;
  const w = 0.8;
  return (
    <Group>
      <Line p1={vec(inset, inset + len)} p2={vec(inset, inset)} strokeWidth={w} color={c} />
      <Line p1={vec(inset, inset)} p2={vec(inset + len, inset)} strokeWidth={w} color={c} />
      <Line p1={vec(width - inset - len, inset)} p2={vec(width - inset, inset)} strokeWidth={w} color={c} />
      <Line p1={vec(width - inset, inset)} p2={vec(width - inset, inset + len)} strokeWidth={w} color={c} />
      <Line p1={vec(inset, height - inset - len)} p2={vec(inset, height - inset)} strokeWidth={w} color={c} />
      <Line p1={vec(inset, height - inset)} p2={vec(inset + len, height - inset)} strokeWidth={w} color={c} />
      <Line
        p1={vec(width - inset - len, height - inset)}
        p2={vec(width - inset, height - inset)}
        strokeWidth={w}
        color={c}
      />
      <Line
        p1={vec(width - inset, height - inset)}
        p2={vec(width - inset, height - inset - len)}
        strokeWidth={w}
        color={c}
      />
    </Group>
  );
}
