import { useCallback, useMemo, useState, type ReactNode } from "react";
import { EXAMPLE_PROFILES, ProfilesContext, type BirthProfile, type ProfilesStore } from "@/profiles";

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<BirthProfile[]>(EXAMPLE_PROFILES);

  const upsert = useCallback((p: BirthProfile) => {
    setProfiles((list) => {
      const i = list.findIndex((x) => x.id === p.id);
      if (i === -1) return [...list, p];
      const next = list.slice();
      next[i] = p;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setProfiles((list) => list.filter((x) => x.id !== id || x.isMe));
  }, []);

  const value = useMemo<ProfilesStore>(() => {
    const me = profiles.find((p) => p.isMe) ?? profiles[0];
    return {
      profiles,
      me,
      friends: profiles.filter((p) => !p.isMe),
      byId: (id) => profiles.find((p) => p.id === id),
      upsert,
      remove,
    };
  }, [profiles, upsert, remove]);

  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>;
}
