import { useCallback, useEffect, useRef } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { magLimitForFov, RAD2DEG } from "@/sky/math";
import type { TelescopeReadout } from "./types";
import type { TelescopeAim } from "./use-telescope-view";

const FLUSH_MS = 100;

export type AimReporter = (alt0: number, az0: number, fovDeg: number) => void;

/**
 * Hands the readout to the HUD at most every `FLUSH_MS`, and only when it
 * actually changed. Reporting on every gesture frame would re-render the whole
 * screen 60+ times a second just to move a few digits.
 *
 * Returns a patch for the aim alone, used while a gesture has the scene frozen.
 */
export function useReadoutReporter(
  readout: TelescopeReadout,
  report: string,
  onReadout?: (r: TelescopeReadout) => void
): AimReporter {
  const latest = useRef({ readout, report });
  latest.current = { readout, report };
  const callback = useRef(onReadout);
  callback.current = onReadout;
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const flush = () => {
      if (latest.current.report === sent.current) return;
      sent.current = latest.current.report;
      callback.current?.(latest.current.readout);
    };
    flush();
    const id = setInterval(flush, FLUSH_MS);
    return () => clearInterval(id);
  }, []);

  return useCallback((alt0, az0, fovDeg) => {
    callback.current?.({
      ...latest.current.readout,
      alt0,
      az0,
      fovDeg,
      magLimit: magLimitForFov(fovDeg),
    });
  }, []);
}

/**
 * Keeps the HUD digits alive during a gesture without rebuilding anything: the
 * aim crosses to the JS thread only when its rounded degrees change, which is
 * all the HUD displays. The star count and the centred object stay as the last
 * build left them until the finger lifts.
 */
export function useAimReporter(aim: TelescopeAim, report: AimReporter) {
  useAnimatedReaction(
    () => [
      Math.round(aim.alt.value * RAD2DEG),
      Math.round(aim.az.value * RAD2DEG),
      Math.round(aim.fov.value),
    ],
    (curr, prev) => {
      if (prev && curr[0] === prev[0] && curr[1] === prev[1] && curr[2] === prev[2]) return;
      runOnJS(report)(aim.alt.value, aim.az.value, aim.fov.value);
    }
  );
}
