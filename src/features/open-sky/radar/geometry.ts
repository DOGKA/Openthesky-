const HALF_PI = Math.PI / 2;

export type RadarGeometry = {
  cx: number;
  cy: number;
  R: number;
};

export function radarProject(alt: number, az: number, g: RadarGeometry) {
  const r = ((HALF_PI - alt) / HALF_PI) * g.R;
  return { x: g.cx - r * Math.sin(az), y: g.cy - r * Math.cos(az) };
}

export function radarRadiusForAlt(altDeg: number, R: number) {
  return (1 - altDeg / 90) * R;
}
