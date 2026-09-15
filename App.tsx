import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { GeistMono_400Regular, GeistMono_500Medium } from "@expo-google-fonts/geist-mono";
import { SKY } from "@/theme";
import { LocaleProvider } from "@/providers/locale-provider";
import { ProfilesProvider } from "@/providers/profiles-provider";
import { DeviceLocationProvider } from "@/providers/device-location-provider";
import { AppRoot } from "@/navigation/app-root";

export default function App() {
  const [fontsLoaded] = useFonts({
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: SKY.bg }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <ProfilesProvider>
            <DeviceLocationProvider>
              {fontsLoaded ? <AppRoot /> : <View style={{ flex: 1, backgroundColor: SKY.bg }} />}
            </DeviceLocationProvider>
          </ProfilesProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
