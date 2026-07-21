import { useEffect, useRef, useCallback } from 'react';

export type SSEStatus = 'connecting' | 'open' | 'closed' | 'error';

interface UseSSEOptions {
  /** Called for each named event received */
  onEvent?: (event: string, data: unknown) => void;
  /** Called when connection opens */
  onOpen?: () => void;
  /** Called on error or unexpected close */
  onError?: (err: Event) => void;
  /** Auto-reconnect delay in ms (0 = disabled). Default: 3000 */
  reconnectDelay?: number;
  /** HTTP method — EventSource is always GET, so for POST use fetchStream instead */
  enabled?: boolean;
}

/**
 * useSSE — subscribes to a Server-Sent Events endpoint.
 * Works with GET SSE endpoints. Returns a `close` function to manually disconnect.
 *
 * Usage:
 *   const { close } = useSSE('/api/admin/live-feed', {
 *     onEvent: (event, data) => { ... }
 *   });
 */
export const useSSE = (url: string, options: UseSSEOptions = {}) => {
  const {
    onEvent,
    onOpen,
    onError,
    reconnectDelay = 3000,
    enabled = true,
  } = options;

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const connect = useCallback(() => {
    if (!enabled || !url) return;

    // Append auth token to URL (EventSource can't set custom headers)
    const token = localStorage.getItem('token');
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = token ? `${url}${separator}token=${token}` : url;

    const es = new EventSource(fullUrl);
    esRef.current = es;

    es.onopen = () => onOpen?.();

    es.onerror = (e) => {
      onError?.(e);
      es.close();
      if (reconnectDelay > 0) {
        reconnectTimer.current = setTimeout(connect, reconnectDelay);
      }
    };

    // Listen to all server-named events by intercepting the raw message
    // EventSource only fires 'message' for unnamed events; named events need explicit listeners.
    // We attach a generic message handler + let consumers add their own.
    es.addEventListener('message', (e) => onEvent?.('message', JSON.parse(e.data)));

    // Named events our server sends:
    const serverEvents = ['connected', 'logs', 'token', 'progress', 'result', 'start', 'done', 'error'];
    serverEvents.forEach(eventName => {
      es.addEventListener(eventName, (e: MessageEvent) => {
        try {
          onEvent?.(eventName, JSON.parse(e.data));
        } catch {
          onEvent?.(eventName, e.data);
        }
      });
    });
  }, [url, enabled, onEvent, onOpen, onError, reconnectDelay]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      esRef.current?.close();
    };
  }, [connect]);

  const close = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    esRef.current?.close();
  }, []);

  return { close };
};

/**
 * fetchStream — uses fetch() with a ReadableStream to consume SSE-style POST endpoints.
 * This is needed for endpoints that require POST body (like coach-stream, analyze-stream).
 *
 * Usage:
 *   const controller = fetchStream('/api/ai/stream-coach', { body }, {
 *     onEvent: (event, data) => { ... },
 *     onDone: () => { ... }
 *   });
 *   // Call controller.abort() to cancel
 */
export const fetchStream = (
  url: string,
  body: Record<string, unknown>,
  callbacks: {
    onEvent: (event: string, data: unknown) => void;
    onDone?: () => void;
    onError?: (err: unknown) => void;
  }
): AbortController => {
  const controller = new AbortController();
  const token = localStorage.getItem('token');

  (async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let currentEvent = 'message';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const raw = line.slice(5).trim();
            try {
              callbacks.onEvent(currentEvent, JSON.parse(raw));
            } catch {
              callbacks.onEvent(currentEvent, raw);
            }
            currentEvent = 'message';
          }
        }
      }
      callbacks.onDone?.();
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        callbacks.onError?.(err);
      }
    }
  })();

  return controller;
};
