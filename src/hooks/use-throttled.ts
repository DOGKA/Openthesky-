import { useEffect, useRef, useState } from "react";

/**
 * Follows `value` but changes at most every `ms`, always settling on the last
 * one. Used to keep an expensive derived value (the sky frame) off the path of
 * a fast drag while the cheap UI keeps up at full rate.
 */
export function useThrottled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  const latest = useRef(value);
  latest.current = value;
  const lastAt = useRef(0);

  useEffect(() => {
    const wait = ms - (Date.now() - lastAt.current);
    if (wait <= 0) {
      lastAt.current = Date.now();
      setSettled(value);
      return;
    }
    const id = setTimeout(() => {
      lastAt.current = Date.now();
      setSettled(latest.current);
    }, wait);
    return () => clearTimeout(id);
  }, [value, ms]);

  return settled;
}
