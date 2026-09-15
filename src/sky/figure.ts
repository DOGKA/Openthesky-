import { Skia, type SkPath, type SkPoint } from "@shopify/react-native-skia";
import { DEG2RAD } from "@/sky/math";
import { loadSkyCatalog } from "./catalog";

export type ConstellationFigure = {
  /** Stick figure, fitted into the requested box. */
  path: SkPath;
  /** The joined stars, so they can be dotted on top of the lines. */
  stars: SkPoint[];
};

const cache = new Map<string, ConstellationFigure | null>();

/**
 * The constellation's own shape, drawn small: an orthographic projection about
 * the figure's centre, scaled into a `size` box and mirrored the way the sky
 * looks from underneath. Time independent, so it is built once per id and size.
 */
export function constellationFigure(id: string, size: number): ConstellationFigure | null {
  const key = `${id}:${size}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const figure = buildFigure(id, size);
  cache.set(key, figure);
  return figure;
}

const PAD = 1.5;

function buildFigure(id: string, size: number): ConstellationFigure | null {
  const constellation = loadSkyCatalog().constellations.find((c) => c.id === id);
  if (!constellation?.lines.length) return null;

  const dec0 = constellation.dec * DEG2RAD;
  const sinDec0 = Math.sin(dec0);
  const cosDec0 = Math.cos(dec0);

  const polys: SkPoint[][] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const poly of constellation.lines) {
    if (poly.length < 2) continue;
    const pts: SkPoint[] = [];
    for (const [raDeg, decDeg] of poly) {
      let dRa = raDeg - constellation.ra;
      if (dRa > 180) dRa -= 360;
      if (dRa < -180) dRa += 360;
      const dec = decDeg * DEG2RAD;
      const ra = dRa * DEG2RAD;
      const sinDec = Math.sin(dec);
      const cosDec = Math.cos(dec);
      const x = -cosDec * Math.sin(ra);
      const y = -(sinDec * cosDec0 - cosDec * sinDec0 * Math.cos(ra));
      pts.push({ x, y });
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    polys.push(pts);
  }
  if (!polys.length) return null;

  const span = Math.max(maxX - minX, maxY - minY, 1e-6);
  const scale = (size - PAD * 2) / span;
  const offX = PAD + (size - PAD * 2 - (maxX - minX) * scale) / 2;
  const offY = PAD + (size - PAD * 2 - (maxY - minY) * scale) / 2;
  const place = (p: SkPoint): SkPoint => ({
    x: offX + (p.x - minX) * scale,
    y: offY + (p.y - minY) * scale,
  });

  const path = Skia.Path.Make();
  const stars: SkPoint[] = [];
  for (const poly of polys) {
    poly.forEach((raw, i) => {
      const p = place(raw);
      if (i === 0) path.moveTo(p.x, p.y);
      else path.lineTo(p.x, p.y);
      stars.push(p);
    });
  }
  return { path, stars };
}
