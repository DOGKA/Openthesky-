import { Circle, Group, Line, vec } from "@shopify/react-native-skia";
import { SKY } from "@/theme";
import { radarProject } from "./geometry";

export function AimMark({
  cx,
  cy,
  R,
  alt,
  az,
  scale,
}: {
  cx: number;
  cy: number;
  R: number;
  alt: number;
  az: number;
  scale: number;
}) {
  const g = { cx, cy, R };
  const p = alt > 0 ? radarProject(alt, az, g) : { x: cx - R * Math.sin(az), y: cy - R * Math.cos(az) };
  const rim = { x: cx - (R + 6 * scale) * Math.sin(az), y: cy - (R + 6 * scale) * Math.cos(az) };
  const rimIn = { x: cx - (R - 4 * scale) * Math.sin(az), y: cy - (R - 4 * scale) * Math.cos(az) };
  return (
    <Group>
      <Line p1={vec(rimIn.x, rimIn.y)} p2={vec(rim.x, rim.y)} strokeWidth={1.4 * scale} color={SKY.accent} />
      {alt > 0 ? (
        <Circle cx={p.x} cy={p.y} r={4 * scale} style="stroke" strokeWidth={1.2 * scale} color={SKY.accent} />
      ) : null}
    </Group>
  );
}
