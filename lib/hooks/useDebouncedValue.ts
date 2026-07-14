'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const isCleared =
    typeof value === 'string' && value.trim().length === 0;

  useEffect(() => {
    if (isCleared) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs, isCleared]);

  if (isCleared) {
    return value;
  }

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs = 300
): T {
  const callbackRef = useRef(callback);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  ) as T;
}
