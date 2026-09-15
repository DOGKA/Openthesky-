import { clamp } from "./angles";
import { starColor } from "./stars";

/** Stars brighter than this are drawn as coloured discs; fainter stay batched points. */
export const FEATURE_MAG = 3.4;

export type StarDisc = {
  core: number;
  glow: number;
  color: string;
  glowColor: string;
  spike: number;
};

export function fluxFromMag(mag: number): number {
  return 10 ** (-0.4 * mag);
}

/** 1 for a few ly, 0 beyond ~200 ly. Apparent size is still a point; this only fattens the halo. */
export function nearWeight(ly: number): number {
  if (!(ly > 0)) return 0;
  return clamp((Math.log10(80) - Math.log10(Math.max(ly, 3))) / 1.6, 0, 1);
}

/** 0 at a wide field, 1 when zoomed in tight. */
export function zoomAmount(fovDeg: number): number {
  return clamp((52 - fovDeg) / 44, 0, 1);
}

export function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return `rgba(255,255,255,${a})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Disc for a bright star. Magnitude sets real brightness (Pogson flux);
 * Skia glow / spikes are the camera-like bloom, stronger when zoomed in
 * and slightly stronger for nearby stars.
 */
export function starDisc(mag: number, bv: number, ly: number, fovDeg: number): StarDisc {
  const zoom = zoomAmount(fovDeg);
  const flux = fluxFromMag(mag);
  const near = nearWeight(ly);
  const color = starColor(bv);
  const grow = (0.72 + 0.78 * zoom) * (1 + 0.22 * near);
  const core = (0.5 + 2.6 * Math.pow(flux, 0.42)) * grow;
  const glow = mag < 2.6 ? (1.4 + 6.2 * Math.pow(flux, 0.38)) * (0.12 + 0.88 * zoom) * (1 + 0.4 * near) : 0;
  const spike = mag < 1.05 && zoom > 0.32 ? (6 + 10 * Math.pow(flux, 0.35)) * zoom * (1 + 0.15 * near) : 0;
  return {
    core: Math.max(0.6, core),
    glow,
    color,
    glowColor: withAlpha(color, 0.18 + 0.22 * zoom),
    spike,
  };
}
