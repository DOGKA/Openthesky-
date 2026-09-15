import { View } from "react-native";
import { NavigationProvider, useNavigation } from "@/navigation/navigator";
import { useProfiles } from "@/profiles";
import { SKY } from "@/theme";
import { HomeView } from "@/features/home/home-view";
import { OpenSkyView } from "@/features/open-sky/open-sky-view";
import { BirthSkyView } from "@/features/birth-sky/birth-sky-view";
import { BirthSkyPosterView } from "@/features/birth-sky/birth-sky-poster-view";
import { SameSkyView } from "@/features/same-sky/same-sky-view";
import { ProfileFormView } from "@/features/profile/profile-form-view";

export function AppRoot() {
  return (
    <NavigationProvider>
      <Router />
    </NavigationProvider>
  );
}

function Router() {
  const { route, pop } = useNavigation();
  const { byId } = useProfiles();

  switch (route.name) {
    case "home":
      return <HomeView />;
    case "sky":
      return (
        <OpenSkyView
          observer={route.params.observer}
          profile={route.params.profileId ? byId(route.params.profileId) : undefined}
          onBack={pop}
        />
      );
    case "birth-sky":
      return <BirthSkyView profileId={route.params.profileId} />;
    case "poster":
      return <BirthSkyPosterView profileId={route.params.profileId} />;
    case "compat":
      return <SameSkyView aId={route.params.aId} bId={route.params.bId} />;
    case "profile-form":
      return <ProfileFormView profileId={route.params.profileId} />;
    default:
      return <View style={{ flex: 1, backgroundColor: SKY.bg }} />;
  }
}
