import { useState, useEffect } from "react";

/**
 * Counts a number up from 0 to `target` once, on mount / when target changes.
 * Respects prefers-reduced-motion (jumps straight to the final value) and
 * degrades gracefully for non-numeric input.
 */
export default function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const finalValue = typeof target === "number" && !Number.isNaN(target) ? target : 0;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || finalValue === 0) {
      setValue(finalValue);
      return;
    }

    let raf;
    let startTime;
    const step = (now) => {
      if (startTime === undefined) startTime = now;
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(finalValue * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
