import { DEG2RAD } from "./angles";

/** Local mean sidereal time in degrees for a date and an east longitude. */
export function getLocalSiderealTime(date: Date, lngDeg: number): number {
  let yr = date.getUTCFullYear();
  let mo = date.getUTCMonth() + 1;
  const dy = date.getUTCDate();
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const s = date.getUTCSeconds();

  if (mo === 1 || mo === 2) {
    yr -= 1;
    mo += 12;
  }

  const a = Math.floor(yr / 100);
  const b = 2 - a + Math.floor(a / 4);
  const c = Math.floor(365.25 * yr);
  const d = Math.floor(30.6001 * (mo + 1));
  const jd = b + c + d - 730550.5 + dy + (h + m / 60 + s / 3600) / 24;
  const jt = jd / 36525;

  let mst =
    280.46061837 +
    360.98564736629 * jd +
    0.000387933 * jt * jt -
    (jt * jt * jt) / 38710000 +
    lngDeg;

  mst %= 360;
  if (mst < 0) mst += 360;
  return mst;
}

export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Mean obliquity of the ecliptic (radians) for T centuries since J2000. */
export function obliquity(T: number): number {
  return (23.439292 - 0.0130042 * T - 1.667e-7 * T * T + 5.028e-7 * T * T * T) * DEG2RAD;
}
