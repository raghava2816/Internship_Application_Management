import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  /** Interval in milliseconds. Default: 10000 (10s) */
  intervalMs?: number;
  /** If true, polling pauses when the browser tab is hidden. Default: true */
  pauseWhenHidden?: boolean;
  /** If false, polling is disabled entirely. Default: true */
  enabled?: boolean;
  /** Fires immediately on mount (before first interval). Default: true */
  immediate?: boolean;
}

/**
 * usePolling — runs a callback on a regular interval.
 * Automatically pauses when the browser tab is hidden to save resources.
 *
 * Usage:
 *   usePolling(fetchStats, { intervalMs: 10000 });
 */
export const usePolling = (
  callback: () => void | Promise<void>,
  options: UsePollingOptions = {}
) => {
  const {
    intervalMs = 10000,
    pauseWhenHidden = true,
    enabled = true,
    immediate = true,
  } = options;

  const savedCallback = useRef(callback);
  const timerId = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Always keep the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const tick = useCallback(async () => {
    if (pauseWhenHidden && document.hidden) return;
    try {
      await savedCallback.current();
    } catch {
      // Polling errors are swallowed silently to avoid crash loops
    }
  }, [pauseWhenHidden]);

  useEffect(() => {
    if (!enabled) return;

    if (immediate) tick();

    timerId.current = setInterval(tick, intervalMs);

    const handleVisibility = () => {
      if (!document.hidden && pauseWhenHidden) tick();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timerId.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, intervalMs, tick, immediate, pauseWhenHidden]);
};
