import type { Locale } from "@/i18n";

export type BodyKind = "sun" | "moon" | "planet" | "earth";

export type BodyElements = {
  a: number;
  e: number;
  i: number;
  L: number;
  W: number;
  N: number;
  da: number;
  de: number;
  di: number;
  dL: number;
  dW: number;
  dN: number;
};

export type BodyNames = Record<Locale, string>;

export type BodyData = {
  id: string;
  kind: BodyKind;
  H: number;
  names: BodyNames;
  elements: BodyElements | null;
};

export type Body = {
  id: string;
  kind: Exclude<BodyKind, "earth">;
  names: BodyNames;
  ra: number;
  dec: number;
  mag: number;
  eclLon: number;
  illumination?: number;
  elongation?: number;
};

export type Vec3 = { x: number; y: number; z: number };
