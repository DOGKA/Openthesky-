/** Small formatting helpers shared by the sky screens. */

export function formatCoord(v: number, pos: string, neg: string): string {
  return `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`;
}

export function formatLatLon(lat: number, lon: number): string {
  return `${formatCoord(lat, "N", "S")} ${formatCoord(lon, "E", "W")}`;
}

/** Local sidereal time as HHh MMm. */
export function formatLst(lstDeg: number): string {
  const hours = lstDeg / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

export function formatDateTime(d: Date, tag: string, tz?: string): string {
  try {
    return new Intl.DateTimeFormat(tag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 16).replace("T", " ");
  }
}

export function formatDate(d: Date, tag: string, tz?: string): string {
  try {
    return new Intl.DateTimeFormat(tag, {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function formatTime(d: Date, tag: string, tz?: string): string {
  try {
    return new Intl.DateTimeFormat(tag, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

export function formatLightYears(ly: number): string {
  if (ly >= 1000) return `${Math.round(ly / 10) * 10}`;
  if (ly >= 100) return `${Math.round(ly)}`;
  return `${Math.round(ly * 10) / 10}`;
}
