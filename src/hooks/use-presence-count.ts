import { useEffect, useRef, useState } from "react";

/**
 * "N people are watching the sky" counter.
 *
 * Backend contract (to be implemented in Astrolic's API):
 *   POST /sky/presence            heartbeat, every HEARTBEAT_MS while the sky is open
 *   GET  /sky/presence  → { live: number, today: number }
 *
 * Until then `fetchPresence` returns a random walk so the UI can be designed
 * against realistic, slowly changing numbers. Swap the body of `fetchPresence`
 * for the real call; nothing else needs to change.
 */
export type Presence = { live: number; today: number };

const HEARTBEAT_MS = 15000;

let mock: Presence | null = null;

async function fetchPresence(): Promise<Presence> {
  // TODO(backend): replace with api.get("/sky/presence")
  if (!mock) {
    const live = 9000 + Math.floor(Math.random() * 6000);
    mock = { live, today: live * 3 + Math.floor(Math.random() * 4000) };
  } else {
    const step = Math.round((Math.random() - 0.48) * 90);
    mock = {
      live: Math.max(500, mock.live + step),
      today: mock.today + Math.max(0, Math.round(Math.random() * 25)),
    };
  }
  return mock;
}

async function sendHeartbeat(): Promise<void> {
  // TODO(backend): api.post("/sky/presence")
}

export function usePresenceCount(): Presence | null {
  const [presence, setPresence] = useState<Presence | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const tick = async () => {
      try {
        await sendHeartbeat();
        const p = await fetchPresence();
        if (alive.current) setPresence(p);
      } catch {}
    };
    tick();
    const id = setInterval(tick, HEARTBEAT_MS);
    return () => {
      alive.current = false;
      clearInterval(id);
    };
  }, []);

  return presence;
}

/** 12402 → "12.402" (tr/de/es) or "12,402" (en). */
export function formatCount(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}
