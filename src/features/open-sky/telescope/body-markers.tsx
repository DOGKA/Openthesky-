import { Circle, Group, Line, Text as SkText, vec, type SkFont } from "@shopify/react-native-skia";
import { SKY } from "@/theme";
import type { Locale } from "@/i18n";
import type { ProjectedBody } from "@/sky/scene";

const RING_R: Record<ProjectedBody["body"]["kind"], number> = {
  sun: 7.5,
  moon: 7,
  planet: 5,
};

export function BodyMarkers({
  bodies,
  font,
  locale,
  activeId,
}: {
  bodies: ProjectedBody[];
  font: SkFont | null;
  locale: Locale;
  activeId: string | null;
}) {
  return (
    <Group>
      {bodies.map(({ x, y, body }) => {
        const r = RING_R[body.kind];
        const active = body.id === activeId;
        const color = active ? SKY.fg : SKY.fg70;
        const label = (body.names[locale] || body.names.en).toUpperCase();
        return (
          <Group key={body.id}>
            <Circle cx={x} cy={y} r={r} style="stroke" strokeWidth={1} color={color} />
            {body.kind === "planet" ? <Circle cx={x} cy={y} r={1.2} color={color} /> : null}
            {body.kind === "sun" ? (
              <>
                <Line p1={vec(x - r - 5, y)} p2={vec(x - r - 2, y)} strokeWidth={1} color={color} />
                <Line p1={vec(x + r + 2, y)} p2={vec(x + r + 5, y)} strokeWidth={1} color={color} />
                <Line p1={vec(x, y - r - 5)} p2={vec(x, y - r - 2)} strokeWidth={1} color={color} />
                <Line p1={vec(x, y + r + 2)} p2={vec(x, y + r + 5)} strokeWidth={1} color={color} />
              </>
            ) : null}
            {font ? (
              <SkText x={x + r + 6} y={y + 3.5} text={label} font={font} color={active ? SKY.fg : SKY.fg50} />
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
}
