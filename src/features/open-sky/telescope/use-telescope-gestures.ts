import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import { DEG2RAD } from "@/sky/math";
import { ALT_MAX, ALT_MIN, FOV_MAX, FOV_MIN } from "./types";
import type { TelescopeAim } from "./use-telescope-view";

/** Shallowest cosine used to widen azimuth steps near the zenith. */
const MIN_COS_ALT = 0.15;

/**
 * Pan, pinch and double tap entirely on the UI thread: every frame of a
 * gesture only writes shared values, and the JS thread is woken once at the
 * end to rebuild the scene for the new aim. The maths is inlined rather than
 * imported because worklets cannot call ordinary JS helpers.
 */
export function useTelescopeGestures(
  aim: TelescopeAim,
  commit: (alt0: number, az0: number, fovDeg: number) => void,
  width: number,
  live: boolean,
  sector: { alt0: number; az0: number; fovDeg: number }
) {
  const startAlt = useSharedValue(0);
  const startAz = useSharedValue(0);
  const startFov = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!live)
        .maxPointers(1)
        .minDistance(2)
        .onStart(() => {
          "worklet";
          startAlt.value = aim.alt.value;
          startAz.value = aim.az.value;
          startFov.value = aim.fov.value;
        })
        .onUpdate((e) => {
          "worklet";
          const scale = width / 2 / Math.tan((startFov.value * DEG2RAD) / 2);
          let alt = startAlt.value + Math.atan(e.translationY / scale);
          if (alt < ALT_MIN) alt = ALT_MIN;
          if (alt > ALT_MAX) alt = ALT_MAX;
          const cosAlt = Math.cos((startAlt.value + alt) / 2);
          aim.alt.value = alt;
          aim.az.value =
            startAz.value +
            Math.atan(e.translationX / scale) / (cosAlt < MIN_COS_ALT ? MIN_COS_ALT : cosAlt);
        })
        .onFinalize(() => {
          "worklet";
          runOnJS(commit)(aim.alt.value, aim.az.value, aim.fov.value);
        }),
    [aim, commit, live, width, startAlt, startAz, startFov]
  );

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          "worklet";
          startFov.value = aim.fov.value;
        })
        .onUpdate((e) => {
          "worklet";
          if (e.numberOfPointers < 2 || !e.scale) return;
          const next = startFov.value / e.scale;
          aim.fov.value = next < FOV_MIN ? FOV_MIN : next > FOV_MAX ? FOV_MAX : next;
        })
        .onFinalize(() => {
          "worklet";
          runOnJS(commit)(aim.alt.value, aim.az.value, aim.fov.value);
        }),
    [aim, commit, startFov]
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!live)
        .numberOfTaps(2)
        .onEnd(() => {
          "worklet";
          aim.alt.value = sector.alt0;
          aim.az.value = sector.az0;
          aim.fov.value = sector.fovDeg;
          runOnJS(commit)(sector.alt0, sector.az0, sector.fovDeg);
        }),
    [aim, commit, live, sector]
  );

  return useMemo(() => Gesture.Simultaneous(pinch, pan, doubleTap), [pan, pinch, doubleTap]);
}
