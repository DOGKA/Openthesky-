import { createContext, useContext, type ReactNode } from "react";
import { useObserverLocation } from "@/hooks/use-observer-location";

type DeviceLocation = ReturnType<typeof useObserverLocation>;

const Ctx = createContext<DeviceLocation | null>(null);

/** One shared location flow for the home card and the sky view. */
export function DeviceLocationProvider({ children }: { children: ReactNode }) {
  const value = useObserverLocation();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDeviceLocation(): DeviceLocation {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDeviceLocation must be used inside DeviceLocationProvider");
  return ctx;
}
