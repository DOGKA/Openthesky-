import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useDerivedValue, useSharedValue, type SharedValue } from "react-native-reanimated";
import { clamp, DEG2RAD, normalizeAz } from "@/sky/math";
import {
  ALT_MAX,
  ALT_MIN,
  FOV_MAX,
  FOV_MIN,
  type TelescopeLook,
  type TelescopeState,
} from "./types";

export type TelescopeAim = {
  alt: SharedValue<number>;
  az: SharedValue<number>;
  fov: SharedValue<number>;
};

/**
 * The aim is held twice: in React state, which the scene is drawn from, and in
 * shared values the gestures write on the UI thread. The canvas is transformed
 * by the difference between the two, so a drag moves the sky at display rate
 * without waking the JS thread and the scene is rebuilt once, on release.
 * Because that transform is exact, the rebuild only adds stars that came into
 * view — the sky never jumps when the finger lifts.
 */
export function useTelescopeView({
  sector,
  width,
  cx,
  cy,
  live,
  look,
}: {
  sector: { alt0: number; az0: number; fovDeg: number };
  width: number;
  cx: number;
  cy: number;
  live: boolean;
  look: TelescopeLook | null;
}) {
  const [view, setView] = useState<TelescopeState>({
    alt0: sector.alt0,
    az0: sector.az0,
    fovDeg: sector.fovDeg,
  });

  const alt = useSharedValue(sector.alt0);
  const az = useSharedValue(sector.az0);
  const fov = useSharedValue(sector.fovDeg);
  const aim = useMemo<TelescopeAim>(() => ({ alt, az, fov }), [alt, az, fov]);

  // What the picture currently on screen was built for.
  const sceneAlt = useSharedValue(sector.alt0);
  const sceneAz = useSharedValue(sector.az0);
  const sceneFov = useSharedValue(sector.fovDeg);

  // Published as soon as React has committed the new scene. Telling the UI
  // thread where the scene points, rather than zeroing an offset, means a late
  // update repeats the previous frame instead of snapping back to centre.
  useLayoutEffect(() => {
    sceneAlt.value = view.alt0;
    sceneAz.value = view.az0;
    sceneFov.value = view.fovDeg;
  }, [view, sceneAlt, sceneAz, sceneFov]);

  const commit = useCallback(
    (alt0: number, az0: number, fovDeg: number) => {
      const wrapped = normalizeAz(az0);
      alt.value = alt0;
      az.value = wrapped;
      fov.value = fovDeg;
      setView((v) =>
        v.alt0 === alt0 && v.az0 === wrapped && v.fovDeg === fovDeg
          ? v
          : { alt0, az0: wrapped, fovDeg }
      );
    },
    [alt, az, fov]
  );

  useEffect(() => {
    if (!live || !look) return;
    commit(clamp(look.alt, ALT_MIN, ALT_MAX), look.az, fov.value);
  }, [live, look, commit, fov]);

  const zoomBy = useCallback(
    (factor: number) => {
      commit(alt.value, az.value, clamp(fov.value * factor, FOV_MIN, FOV_MAX));
    },
    [commit, alt, az, fov]
  );

  /**
   * Maps the drawn scene onto the live aim. Two gnomonic views of the same sky
   * differ by a projective transform, so this is exact rather than an
   * approximation — verified against rebuilt positions to 1e-13 px for pans of
   * a full screen, zooms up to 3x and aims at the zenith. Row major, the order
   * SkMatrix expects, with the bottom row carrying the perspective.
   */
  const matrix = useDerivedValue<number[]>(() => {
    const sceneScale = width / 2 / Math.tan((sceneFov.value * DEG2RAD) / 2);
    const liveScale = width / 2 / Math.tan((fov.value * DEG2RAD) / 2);

    // Camera basis of the drawn scene: w at the centre, e east, n up.
    const sa = Math.sin(sceneAlt.value);
    const ca = Math.cos(sceneAlt.value);
    const sz = Math.sin(sceneAz.value);
    const cz = Math.cos(sceneAz.value);
    const w0x = ca * cz;
    const w0y = ca * sz;
    const w0z = sa;
    const e0x = -sz;
    const e0y = cz;
    const n0x = -sa * cz;
    const n0y = -sa * sz;
    const n0z = ca;

    // Camera basis of the live aim.
    const sa1 = Math.sin(alt.value);
    const ca1 = Math.cos(alt.value);
    const sz1 = Math.sin(az.value);
    const cz1 = Math.cos(az.value);
    const w1x = ca1 * cz1;
    const w1y = ca1 * sz1;
    const w1z = sa1;
    const e1x = -sz1;
    const e1y = cz1;
    const n1x = -sa1 * cz1;
    const n1y = -sa1 * sz1;
    const n1z = ca1;

    // The east axes have no vertical component, which drops those terms.
    const ea = e0x * e1x + e0y * e1y;
    const eb = n0x * e1x + n0y * e1y;
    const e0 = w0x * e1x + w0y * e1y;
    const na = e0x * n1x + e0y * n1y;
    const nb = n0x * n1x + n0y * n1y + n0z * n1z;
    const n0 = w0x * n1x + w0y * n1y + w0z * n1z;
    const wa = e0x * w1x + e0y * w1y;
    const wb = n0x * w1x + n0y * w1y + n0z * w1z;
    const w0 = w0x * w1x + w0y * w1y + w0z * w1z;

    // Scene pixels back to tangent plane offsets, then forward through the
    // live basis: linear in (x, y, 1), so one 3x3 covers it.
    const p = -1 / sceneScale;
    const qx = cx / sceneScale;
    const qy = cy / sceneScale;
    const dx = wa * p;
    const dy = wb * p;
    const dw = w0 + wa * qx + wb * qy;

    return [
      cx * dx - liveScale * ea * p,
      cx * dy - liveScale * eb * p,
      cx * dw - liveScale * (e0 + ea * qx + eb * qy),
      cy * dx - liveScale * na * p,
      cy * dy - liveScale * nb * p,
      cy * dw - liveScale * (n0 + na * qx + nb * qy),
      dx,
      dy,
      dw,
    ];
  });

  return { view, aim, matrix, commit, zoomBy };
}
