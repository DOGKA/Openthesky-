import { useEffect, useRef } from "react";
import type { TelescopeReadout } from "./types";

const FLUSH_MS = 100;

/**
 * Hands the readout to the HUD at most every `FLUSH_MS`, and only when it
 * actually changed. Reporting on every gesture frame would re-render the whole
 * screen 60+ times a second just to move a few digits.
 */
export function useReadoutReporter(
  readout: TelescopeReadout,
  report: string,
  onReadout?: (r: TelescopeReadout) => void
) {
  const latest = useRef({ readout, report });
  latest.current = { readout, report };
  const callback = useRef(onReadout);
  callback.current = onReadout;
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const flush = () => {
      if (latest.current.report === sent.current) return;
      sent.current = latest.current.report;
      callback.current?.(latest.current.readout);
    };
    flush();
    const id = setInterval(flush, FLUSH_MS);
    return () => clearInterval(id);
  }, []);
}
