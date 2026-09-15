import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

export type ObserverLocation = {
  latitude: number;
  longitude: number;
  /** "gps" = device fix, "fallback" = user accepted the approximate default */
  source: "gps" | "fallback";
};

export type LocationStatus =
  | "checking" // reading the current permission state on mount
  | "prompt" // permission not granted yet, show our explanation + button
  | "requesting" // OS dialog open / fix in progress
  | "ready" // we have coordinates
  | "denied" // user refused, offer the fallback
  | "unavailable"; // permission ok but no fix could be obtained

/** Istanbul — used only when the user explicitly accepts the fallback. */
export const FALLBACK_LOCATION: ObserverLocation = {
  latitude: 41.0082,
  longitude: 28.9784,
  source: "fallback",
};

const FIX_TIMEOUT_MS = 8000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/**
 * Location flow for the sky view. Never prompts on its own: the screen shows
 * an explanation first and calls `request()` from a button, which is both the
 * store-review-friendly pattern and what Astrolic already does.
 */
export function useObserverLocation() {
  const [status, setStatus] = useState<LocationStatus>("checking");
  const [location, setLocation] = useState<ObserverLocation | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const resolveFix = useCallback(async () => {
    setStatus("requesting");
    try {
      // fast path: last known position
      const last = await Location.getLastKnownPositionAsync();
      if (last && alive.current) {
        setLocation({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          source: "gps",
        });
        setStatus("ready");
      }

      const current = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        }),
        FIX_TIMEOUT_MS
      );
      if (!alive.current) return;
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        source: "gps",
      });
      setStatus("ready");
    } catch {
      if (!alive.current) return;
      // If the last-known fix already made us ready, keep it.
      setStatus((s) => (s === "ready" ? s : "unavailable"));
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status: s } = await Location.getForegroundPermissionsAsync();
        if (!alive.current) return;
        if (s === "granted") {
          await resolveFix();
        } else {
          setStatus("prompt");
        }
      } catch {
        if (alive.current) setStatus("prompt");
      }
    })();
  }, [resolveFix]);

  const request = useCallback(async () => {
    setStatus("requesting");
    try {
      const { status: s } = await Location.requestForegroundPermissionsAsync();
      if (!alive.current) return;
      if (s === "granted") {
        await resolveFix();
      } else {
        setStatus("denied");
      }
    } catch {
      if (alive.current) setStatus("denied");
    }
  }, [resolveFix]);

  const useFallback = useCallback(() => {
    setLocation(FALLBACK_LOCATION);
    setStatus("ready");
  }, []);

  return { status, location, request, useFallback, retry: resolveFix };
}
