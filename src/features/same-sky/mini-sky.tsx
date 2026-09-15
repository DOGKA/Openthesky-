import { View } from "react-native";
import { Canvas } from "@shopify/react-native-skia";
import { MonoText } from "@/components/mono-text";
import { OpenSkyRadarGraphic } from "@/features/open-sky/radar/radar-graphic";
import type { SkyFrame } from "@/sky/frame";

export function MiniSky({
  name,
  city,
  when,
  frame,
  size,
}: {
  name: string;
  city: string;
  when: string;
  frame: SkyFrame;
  size: number;
}) {
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Canvas style={{ width: size, height: size, alignSelf: "center" }}>
        <OpenSkyRadarGraphic
          frame={frame}
          cx={size / 2}
          cy={size / 2}
          R={size / 2 - 4}
          magLimit={4.0}
          grid={false}
        />
      </Canvas>
      <MonoText size={12} dim="none" medium>
        {name}
      </MonoText>
      <MonoText size={9} dim="faint">
        {city}
      </MonoText>
      <MonoText size={9} dim="muted">
        {when}
      </MonoText>
    </View>
  );
}
