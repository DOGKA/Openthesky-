import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BackHandler } from "react-native";
import type { Observer } from "@/profiles";

/**
 * Minimal state-based stack for the prototype. In Astrolic these become
 * expo-router routes (app/(stars)/open-sky.tsx, birth-sky.tsx, ...).
 */
export type Route =
  | { name: "home" }
  | { name: "sky"; params: { observer?: Observer; profileId?: string } }
  | { name: "birth-sky"; params: { profileId: string } }
  | { name: "poster"; params: { profileId: string } }
  | { name: "compat"; params: { aId: string; bId: string } }
  | { name: "profile-form"; params: { profileId?: string } };

type Nav = {
  route: Route;
  canGoBack: boolean;
  push: (r: Route) => void;
  pop: () => void;
  reset: (r: Route) => void;
};

const NavContext = createContext<Nav | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: "home" }]);

  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const reset = useCallback((r: Route) => setStack([r]), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stack.length > 1) {
        pop();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, pop]);

  const value = useMemo<Nav>(
    () => ({ route: stack[stack.length - 1], canGoBack: stack.length > 1, push, pop, reset }),
    [stack, push, pop, reset]
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNavigation(): Nav {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNavigation must be used inside NavigationProvider");
  return ctx;
}
