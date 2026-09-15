import { useCallback, useMemo, useState } from "react";
import { nextBirthdayInstant, type BirthProfile, type Observer } from "@/profiles";
import { useNow } from "@/hooks/use-now";
import { useDeviceLook } from "@/hooks/use-device-look";
import { useDeviceLocation } from "@/providers/device-location-provider";
import { useSkyFrame } from "@/sky/use-sky-frame";
import { DEG2RAD } from "@/sky/math";
import type { SkySector } from "@/sky/sectors";
import { useLocale } from "@/providers/locale-provider";
import type { TelescopeReadout } from "./telescope/types";
import type { TimePreset } from "./time-scrubber";

export const GRID_MAG_LIMIT = 4.5;

export const LIVE_SECTOR: SkySector = {
  id: "live",
  band: "low",
  alt0: 35 * DEG2RAD,
  az0: 0,
  fovDeg: 50,
  altRange: [0, 90],
};

export function useOpenSky(observer?: Observer, profile?: BirthProfile) {
  const { t, locale, tag } = useLocale();
  const now = useNow(30000);
  const device = useDeviceLocation();
  const latitude = observer ? observer.latitude : device.location?.latitude ?? null;
  const longitude = observer ? observer.longitude : device.location?.longitude ?? null;
  const approx = !observer && device.location?.source === "fallback";

  const [offsetMs, setOffsetMs] = useState(0);
  const base = observer?.date ?? now;
  const date = useMemo(() => new Date(base.getTime() + offsetMs), [base, offsetMs]);
  const frame = useSkyFrame(latitude, longitude, date);

  const presets = useMemo<TimePreset[]>(() => {
    if (observer?.date && profile) {
      const birth = observer.date.getTime();
      return [
        { id: "birth", label: t("time_birth"), offsetMs: 0 },
        { id: "now", label: t("time_now"), offsetMs: Date.now() - birth },
        { id: "next", label: t("time_next_birthday"), offsetMs: nextBirthdayInstant(profile).getTime() - birth },
      ];
    }
    return [{ id: "now", label: t("time_now"), offsetMs: 0 }];
  }, [observer, profile, t]);

  const [sector, setSector] = useState<SkySector | null>(null);
  const [readout, setReadout] = useState<TelescopeReadout | null>(null);
  const [live, setLive] = useState(false);
  const deviceLook = useDeviceLook(live);

  const openSector = useCallback((s: SkySector) => {
    setReadout(null);
    setLive(false);
    setSector(s);
  }, []);
  const closeSector = useCallback(() => {
    setLive(false);
    setSector(null);
  }, []);
  const startLive = useCallback(() => {
    setReadout(null);
    setLive(true);
    setSector((s) => s ?? LIVE_SECTOR);
  }, []);
  const toggleLive = useCallback(() => {
    setLive((on) => {
      if (on) return false;
      setSector((s) => s ?? LIVE_SECTOR);
      return true;
    });
  }, []);

  return {
    t,
    locale,
    tag,
    device,
    latitude,
    longitude,
    approx,
    date,
    offsetMs,
    setOffsetMs,
    frame,
    presets,
    sector,
    readout,
    setReadout,
    live,
    deviceLook,
    openSector,
    closeSector,
    startLive,
    toggleLive,
    observer,
  };
}
