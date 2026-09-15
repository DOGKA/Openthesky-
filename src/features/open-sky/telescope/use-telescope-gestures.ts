import { useCallback, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import { Gesture } from "react-native-gesture-handler";
import { clamp, DEG2RAD, focalScale, normalizeAz } from "@/sky/math";
import { FOV_MAX, FOV_MIN, type TelescopeState } from "./types";

const ALT_MIN = -6 * DEG2RAD;
const ALT_MAX = 89.5 * DEG2RAD;

export function useTelescopeGestures(
  view: TelescopeState,
  setView: Dispatch<SetStateAction<TelescopeState>>,
  width: number,
  live: boolean,
  sector: { alt0: number; az0: number; fovDeg: number }
) {
  // Latest view kept in a ref so the gesture objects stay stable while a
  // gesture is in flight; rebuilding them mid-pinch drops scale updates.
  const viewRef = useRef(view);
  viewRef.current = view;
  const startRef = useRef(view);
  const beginGesture = useCallback(() => {
    startRef.current = viewRef.current;
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!live)
        .maxPointers(1)
        .runOnJS(true)
        .minDistance(2)
        .onStart(beginGesture)
        .onUpdate((e) => {
          const start = startRef.current;
          const scale = focalScale(start.fovDeg * DEG2RAD, width);
          const dAlt = Math.atan(e.translationY / scale);
          const alt0 = clamp(start.alt0 + dAlt, ALT_MIN, ALT_MAX);
          const dAz =
            Math.atan(e.translationX / scale) / Math.max(Math.cos((start.alt0 + alt0) / 2), 0.15);
          setView((v) => ({ ...v, alt0, az0: normalizeAz(start.az0 + dAz) }));
        }),
    [beginGesture, width, live, setView]
  );

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onStart(beginGesture)
        .onUpdate((e) => {
          if (e.numberOfPointers < 2 || !e.scale) return;
          const start = startRef.current;
          setView((v) => ({ ...v, fovDeg: clamp(start.fovDeg / e.scale, FOV_MIN, FOV_MAX) }));
        }),
    [beginGesture, setView]
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .numberOfTaps(2)
        .onEnd(() => {
          if (!live) setView({ alt0: sector.alt0, az0: sector.az0, fovDeg: sector.fovDeg });
        }),
    [sector, live, setView]
  );

  const gesture = useMemo(
    () => Gesture.Simultaneous(pinch, pan, doubleTap),
    [pan, pinch, doubleTap]
  );
  return gesture;
}

export function useLiveLook(
  live: boolean,
  look: { alt: number; az: number } | null,
  setView: Dispatch<SetStateAction<TelescopeState>>
) {
  useEffect(() => {
    if (!live || !look) return;
    setView((v) => ({
      ...v,
      alt0: clamp(look.alt, ALT_MIN, ALT_MAX),
      az0: look.az,
    }));
  }, [live, look, setView]);
}
