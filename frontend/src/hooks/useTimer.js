import { useState, useRef, useCallback } from "react";

/**
 * Timer hook with recommended duration and progress tracking.
 */
export default function useTimer(recommendedSeconds = 120) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setSeconds(0);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
  }, [stop]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = Math.min(1, seconds / recommendedSeconds);

  const getBarColor = () => {
    if (progress < 0.5) return "var(--accent-green)";
    if (progress < 0.8) return "var(--accent-cyan)";
    if (progress < 1) return "var(--accent-amber)";
    return "var(--accent-red)";
  };

  return {
    seconds,
    isRunning,
    formattedTime: formatTime(seconds),
    recommendedTime: formatTime(recommendedSeconds),
    progress,
    barColor: getBarColor(),
    start,
    stop,
    reset,
  };
}
