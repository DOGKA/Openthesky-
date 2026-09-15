import type { SkyFrame } from "@/sky/frame";

export type TelescopeState = {
  alt0: number;
  az0: number;
  fovDeg: number;
};

export type CenteredObject = {
  kind: "constellation" | "sun" | "moon" | "planet";
  id: string;
  name: string;
  illumination?: number;
};

export type TelescopeReadout = TelescopeState & {
  magLimit: number;
  visibleCount: number;
  centered: CenteredObject | null;
};

export type TelescopeLook = { alt: number; az: number };

export type TelescopeProps = {
  frame: SkyFrame;
  sector: { alt0: number; az0: number; fovDeg: number };
  width: number;
  height: number;
  locale: import("@/i18n").Locale;
  onReadout?: (r: TelescopeReadout) => void;
  live?: boolean;
  look?: TelescopeLook | null;
};

export const FOV_MIN = 6;
export const FOV_MAX = 90;
export const NAME_FOV_MAX = 40;
export const RETICLE_SIZE = 64;
export const BODY_LOCK_DEG = 3;
