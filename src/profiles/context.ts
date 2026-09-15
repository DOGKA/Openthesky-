import { createContext, useContext } from "react";
import type { ProfilesStore } from "./types";

export const ProfilesContext = createContext<ProfilesStore | null>(null);

export function useProfiles(): ProfilesStore {
  const ctx = useContext(ProfilesContext);
  if (!ctx) throw new Error("useProfiles must be used inside ProfilesProvider");
  return ctx;
}
