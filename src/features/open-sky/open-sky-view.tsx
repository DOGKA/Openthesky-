import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/theme";
import type { BirthProfile, Observer } from "@/profiles";
import { OpenSkyLocationGate } from "./location-gate";
import { OpenSkyGrid } from "./open-sky-grid";
import { OpenSkyVisor } from "./open-sky-visor";
import { useOpenSky } from "./use-open-sky";

type Props = {
  observer?: Observer;
  profile?: BirthProfile;
  onBack?: () => void;
};

export function OpenSkyView({ observer, profile, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const sky = useOpenSky(observer, profile);

  if (!observer && (sky.device.status !== "ready" || !sky.device.location)) {
    return (
      <View style={{ flex: 1, backgroundColor: SKY.bg, paddingBottom: insets.bottom }}>
        <StatusBar style="light" />
        <OpenSkyLocationGate
          status={sky.device.status}
          t={sky.t}
          onRequest={sky.device.request}
          onFallback={sky.device.useFallback}
          onRetry={sky.device.retry}
        />
      </View>
    );
  }

  if (!sky.frame || sky.latitude == null || sky.longitude == null) {
    return (
      <View style={{ flex: 1, backgroundColor: SKY.bg, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <StatusBar style="light" />
        <ActivityIndicator color={SKY.fg50} />
        <MonoText size={10} dim="faint" upper>
          {sky.t("computing")}
        </MonoText>
      </View>
    );
  }

  const location = { latitude: sky.latitude, longitude: sky.longitude, approx: sky.approx };

  if (sky.sector) {
    return (
      <OpenSkyVisor
        frame={sky.frame}
        sector={sky.sector}
        locale={sky.locale}
        t={sky.t}
        tag={sky.tag}
        date={sky.date}
        location={location}
        label={observer?.label}
        live={sky.live}
        look={sky.deviceLook.look}
        liveState={sky.deviceLook}
        readout={sky.readout}
        onReadout={sky.setReadout}
        onBack={sky.closeSector}
        onToggleLive={sky.toggleLive}
        offsetMs={sky.offsetMs}
        onOffset={sky.setOffsetMs}
        presets={sky.presets}
      />
    );
  }

  return (
    <OpenSkyGrid
      frame={sky.frame}
      date={sky.date}
      latitude={sky.latitude}
      longitude={sky.longitude}
      approx={sky.approx}
      observerLabel={observer?.label}
      onBack={onBack}
      t={sky.t}
      tag={sky.tag}
      offsetMs={sky.offsetMs}
      onOffset={sky.setOffsetMs}
      presets={sky.presets}
      onSelect={sky.openSector}
      onLive={sky.startLive}
      aim={sky.deviceLook.look}
    />
  );
}
