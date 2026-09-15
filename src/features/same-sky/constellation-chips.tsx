import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import type { FrameConstellation } from "@/sky/frame";
import { constellationName } from "@/sky/insights";
import { useLocale } from "@/providers/locale-provider";

export function ChipsHeader({
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

/** Constellations as a wrapping grid of IAU-code + name chips, collapsed to `limit`. */
export function ConstellationChips({
  items,
  limit = 9,
  quiet = false,
}: {
  items: FrameConstellation[];
  limit?: number;
  quiet?: boolean;
}) {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  // Best-known constellations first, then the highest in the sky, so the
  // collapsed preview is never a random alphabetical slice.
  const ordered = useMemo(
    () => [...items].sort((x, y) => x.rank - y.rank || y.center.alt - x.center.alt),
    [items]
  );
  const hidden = Math.max(0, ordered.length - limit);
  const shown = expanded || hidden === 0 ? ordered : ordered.slice(0, limit);

  if (!items.length) {
    return (
      <MonoText size={12} dim="muted">
        —
      </MonoText>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {shown.map((c) => (
        <View
          key={c.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 5,
            paddingHorizontal: 8,
            borderWidth: 1,
            borderColor: quiet ? SKY.fg12 : SKY.fg22,
            backgroundColor: quiet ? "transparent" : SKY.fg06,
            borderRadius: 3,
          }}
        >
          <MonoText size={8} dim="faint" tracking={0.6}>
            {c.id.toUpperCase()}
          </MonoText>
          <MonoText size={11} dim={quiet ? "muted" : "soft"}>
            {constellationName(c, locale)}
          </MonoText>
        </View>
      ))}
      {hidden > 0 ? (
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          hitSlop={6}
          style={({ pressed }) => ({
            paddingVertical: 5,
            paddingHorizontal: 10,
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
  );
}
