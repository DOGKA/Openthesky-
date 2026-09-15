import { useEffect, useRef, useState } from "react";
import { DeviceMotion, Magnetometer } from "expo-sensors";
import {
  deviceLookFromSensors,
  lerp,
  lerpAz,
  type DeviceLook,
  type Vec3,
} from "@/sky/look";
import { clamp } from "@/sky/math";

export type DeviceLookState = {
  look: DeviceLook | null;
  /** sensors granted and streaming */
  active: boolean;
  /** heading is too noisy / missing (typical in the iOS Simulator) */
  headingUnreliable: boolean;
  error: "denied" | "unavailable" | null;
};

const INTERVAL_MS = 70; // ~14 Hz — enough to feel live, cheap enough to reproject
const SMOOTH = 0.28;

/**
 * Follows the rear camera: tilt → altitude, compass → azimuth.
 * Call with `enabled=true` only in Live mode so we don't drain the magnetometer
 * on the home screen.
 */
export function useDeviceLook(enabled: boolean): DeviceLookState {
  const [look, setLook] = useState<DeviceLook | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<DeviceLookState["error"]>(null);
  const smoothed = useRef<DeviceLook | null>(null);
  const lastGoodAz = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setActive(false);
      return;
    }

    let cancelled = false;
    let motionSub: { remove: () => void } | null = null;
    let magSub: { remove: () => void } | null = null;
    let gravity: Vec3 | null = null;
    let magnetic: Vec3 | null = null;

    const tick = () => {
      if (!gravity) return;
      const raw = deviceLookFromSensors(gravity, magnetic ?? { x: 0, y: 0, z: 0 });
      if (!raw) return;
      const az = raw.headingQuality >= 0.12 ? raw.az : lastGoodAz.current;
      if (raw.headingQuality >= 0.12) lastGoodAz.current = az;
      const next: DeviceLook = { ...raw, az };
      const prev = smoothed.current;
      const mixed: DeviceLook = prev
        ? {
            alt: lerp(prev.alt, next.alt, SMOOTH),
            az: lerpAz(prev.az, next.az, SMOOTH),
            headingQuality: lerp(prev.headingQuality, next.headingQuality, SMOOTH),
          }
        : next;
      smoothed.current = mixed;
      setLook({
        alt: clamp(mixed.alt, -Math.PI / 2, Math.PI / 2),
        az: mixed.az,
        headingQuality: mixed.headingQuality,
      });
    };

    (async () => {
      try {
        const motionPerm = await DeviceMotion.requestPermissionsAsync();
        const magPerm = await Magnetometer.requestPermissionsAsync();
        if (cancelled) return;
        if (motionPerm.status !== "granted") {
          setError("denied");
          return;
        }
        const motionAvail = await DeviceMotion.isAvailableAsync();
        if (!motionAvail) {
          setError("unavailable");
          return;
        }

        DeviceMotion.setUpdateInterval(INTERVAL_MS);
        Magnetometer.setUpdateInterval(INTERVAL_MS);

        motionSub = DeviceMotion.addListener((data) => {
          const g = data.accelerationIncludingGravity;
          if (!g) return;
          gravity = { x: g.x, y: g.y, z: g.z };
          tick();
        });

        if (magPerm.status === "granted" && (await Magnetometer.isAvailableAsync())) {
          magSub = Magnetometer.addListener((m) => {
            magnetic = { x: m.x, y: m.y, z: m.z };
          });
        }

        setActive(true);
        setError(null);
      } catch {
        if (!cancelled) setError("unavailable");
      }
    })();

    return () => {
      cancelled = true;
      motionSub?.remove();
      magSub?.remove();
    };
  }, [enabled]);

  const headingUnreliable = !look || look.headingQuality < 0.18;

  return { look, active, headingUnreliable, error };
}
