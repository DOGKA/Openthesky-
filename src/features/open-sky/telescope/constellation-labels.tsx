import { Text as SkText, type SkFont } from "@shopify/react-native-skia";
import { SKY } from "@/theme";
import type { ProjectedLabel } from "@/sky/scene";

export function ConstellationLabels({
  font,
  labels,
  nearestId,
}: {
  font: SkFont;
  labels: ProjectedLabel[];
  nearestId: string | null;
}) {
  return (
    <>
      {labels.map((l) => {
        const text = l.constellation.id.toUpperCase();
        return (
          <SkText
            key={l.constellation.id}
            x={l.x - font.getTextWidth(text) / 2}
            y={l.y + 4}
            text={text}
            font={font}
            color={l.constellation.id === nearestId ? SKY.fg70 : SKY.fg35}
          />
        );
      })}
    </>
  );
}
