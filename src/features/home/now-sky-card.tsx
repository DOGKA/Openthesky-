import { View, useWindowDimensions } from "react-native";
import { Canvas } from "@shopify/react-native-skia";
import Animated, { FadeIn } from "react-native-reanimated";
import { MonoText } from "@/components/mono-text";
import { OutlineButton, Panel, SectionLabel } from "@/components/ui";
import { formatLatLon, formatTime } from "@/format";
import { useNow } from "@/hooks/use-now";
import { useSkyFrame } from "@/sky/use-sky-frame";
import { useLocale } from "@/providers/locale-provider";
import { useDeviceLocation } from "@/providers/device-location-provider";
import { useNavigation } from "@/navigation/navigator";
import { OpenSkyRadarGraphic } from "@/features/open-sky/radar/radar-graphic";

export function NowSkyCard() {
  const { width } = useWindowDimensions();
  const { t, tag } = useLocale();
  const nav = useNavigation();
  const device = useDeviceLocation();
  const now = useNow(60000);
  const frame = useSkyFrame(
    device.location?.latitude ?? null,
    device.location?.longitude ?? null,
    now
  );
  const cardSize = Math.min(width - 40 - 32, 260);

  return (
    <View style={{ gap: 10 }}>
      <SectionLabel index="01">{t("now_sky")}</SectionLabel>
      <Panel onPress={device.location ? () => nav.push({ name: "sky", params: {} }) : undefined}>
        {frame && device.location ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center", gap: 12 }}>
            <Canvas style={{ width: cardSize, height: cardSize }}>
              <OpenSkyRadarGraphic
                frame={frame}
                cx={cardSize / 2}
                cy={cardSize / 2}
                R={cardSize / 2 - 6}
                magLimit={4.0}
                grid={false}
              />
            </Canvas>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch" }}>
              <MonoText size={9} dim="faint">
                {formatTime(now, tag)} {t("local")} · {formatLatLon(device.location.latitude, device.location.longitude)}
              </MonoText>
              <MonoText size={9} dim="faint" upper>
                {t("now_sky_hint")}
              </MonoText>
            </View>
          </Animated.View>
        ) : (
          <View style={{ gap: 12 }}>
            <MonoText size={12} dim="soft">
              {t("loc_body")}
            </MonoText>
            {device.status === "denied" || device.status === "unavailable" ? (
              <View style={{ gap: 8 }}>
                <OutlineButton label={t("loc_retry")} onPress={device.retry} />
                <OutlineButton label={t("loc_fallback")} onPress={device.useFallback} />
              </View>
            ) : (
              <OutlineButton
                label={device.status === "requesting" ? t("loc_requesting") : t("loc_button")}
                onPress={device.request}
                primary
                disabled={device.status === "requesting" || device.status === "checking"}
              />
            )}
          </View>
        )}
      </Panel>
    </View>
  );
}
