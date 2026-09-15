import { View } from "react-native";
import { NavigationProvider, useNavigation } from "@/navigation/navigator";
import { useProfiles } from "@/lib/profiles";
import { SKY } from "@/lib/theme";
import { HomeView } from "@/sections/home/view/home-view";
import { OpenSkyView } from "@/sections/open-sky/view/open-sky-view";
import { BirthSkyView } from "@/sections/birth-sky/view/birth-sky-view";
import { BirthSkyPosterView } from "@/sections/birth-sky/view/birth-sky-poster-view";
import { SameSkyView } from "@/sections/compat/view/same-sky-view";
import { ProfileFormView } from "@/sections/profile/view/profile-form-view";

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
