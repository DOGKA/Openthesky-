import { useCallback, useMemo, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import { Canvas, Group, Path, Points } from "@shopify/react-native-skia";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import type { FrameConstellation } from "@/sky/frame";
import { constellationFigure } from "@/sky/figure";
import { constellationName } from "@/sky/insights";
import { useLocale } from "@/providers/locale-provider";

const COLS = 2;
const GAP = 6;
const CELL_H = 40;
const GLYPH = 28;
const GLYPH_X = 6;

export function GroupHeader({
  label,
  count,
  size = 9,
}: {
  label: string;
  count: number;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <MonoText size={size} dim="faint" upper tracking={0.8} style={{ flex: 1 }}>
        {label}
      </MonoText>
      <MonoText size={size} dim="muted" medium>
        {count}
      </MonoText>
    </View>
  );
}

/**
 * Constellations on a fixed two column grid, each cell carrying the figure's
 * own shape. The shapes live in one canvas per group rather than one per cell,
 * so a long list stays a single Skia surface.
 */
export function ConstellationGrid({
  items,
  limit = 8,
  quiet = false,
}: {
  items: FrameConstellation[];
  limit?: number;
  quiet?: boolean;
}) {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setWidth((prev) => (prev === w ? prev : w));
  }, []);

  // Best known constellations first, then the highest in the sky, so a
  // collapsed list is never a random alphabetical slice.
  const ordered = useMemo(
    () => [...items].sort((a, b) => a.rank - b.rank || b.center.alt - a.center.alt),
    [items]
  );
  const hidden = Math.max(0, ordered.length - limit);
  const shown = expanded || hidden === 0 ? ordered : ordered.slice(0, limit);

  const cellW = width > 0 ? (width - GAP * (COLS - 1)) / COLS : 0;
  const rows = Math.ceil((shown.length + (hidden > 0 ? 1 : 0)) / COLS);
  const gridH = rows * CELL_H + Math.max(0, rows - 1) * GAP;

  const glyphs = useMemo(() => {
    if (cellW <= 0) return [];
    return shown.flatMap((c, i) => {
      const figure = constellationFigure(c.id, GLYPH);
      if (!figure) return [];
      return [
        {
          id: c.id,
          figure,
          dx: (i % COLS) * (cellW + GAP) + GLYPH_X,
          dy: Math.floor(i / COLS) * (CELL_H + GAP) + (CELL_H - GLYPH) / 2,
        },
      ];
    });
  }, [shown, cellW]);

  if (!items.length) {
    return (
      <MonoText size={12} dim="muted">
        —
      </MonoText>
    );
  }

  return (
    <View onLayout={onLayout}>
      {cellW > 0 ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
            {shown.map((c) => (
              <View
                key={c.id}
                style={{
                  width: cellW,
                  height: CELL_H,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingLeft: GLYPH_X + GLYPH + 6,
                  paddingRight: 6,
                  borderWidth: 1,
                  borderColor: quiet ? SKY.fg12 : SKY.fg22,
                  backgroundColor: quiet ? "transparent" : SKY.fg06,
                  borderRadius: 3,
                }}
              >
                <MonoText size={8} dim="faint" tracking={0.6}>
                  {c.id.toUpperCase()}
                </MonoText>
                <MonoText
                  size={10}
                  dim={quiet ? "muted" : "soft"}
                  numberOfLines={1}
                  style={{ flex: 1 }}
                >
                  {constellationName(c, locale)}
                </MonoText>
              </View>
            ))}
            {hidden > 0 ? (
              <Pressable
                onPress={() => setExpanded((e) => !e)}
                style={({ pressed }) => ({
                  width: cellW,
                  height: CELL_H,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: SKY.fg22,
                  borderRadius: 3,
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <MonoText size={11} dim="soft" medium>
                  {expanded ? `−${hidden}` : `+${hidden}`}
                </MonoText>
              </Pressable>
            ) : null}
          </View>
          <Canvas
            pointerEvents="none"
            style={{ position: "absolute", left: 0, top: 0, width, height: gridH }}
          >
            {glyphs.map((g) => (
              <Group key={g.id} transform={[{ translateX: g.dx }, { translateY: g.dy }]}>
                <Path
                  path={g.figure.path}
                  style="stroke"
                  strokeWidth={0.7}
                  color={quiet ? SKY.fg22 : SKY.constellationLine}
                />
                <Points
                  points={g.figure.stars}
                  mode="points"
                  style="stroke"
                  strokeCap="round"
                  strokeWidth={1.5}
                  color={quiet ? SKY.fg35 : SKY.fg70}
                />
              </Group>
            ))}
          </Canvas>
        </>
      ) : null}
    </View>
  );
}
