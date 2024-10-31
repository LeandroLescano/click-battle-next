import {useCallback, useEffect, useRef, useState} from "react";

export const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handleTimeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handleTimeout);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useDebouncedCallback = <T>(
  callback: (...args: T[]) => void,
  delay: number
) => {
  const timeoutRef = useRef<number | undefined>();

  const debouncedCallback = useCallback(
    (...args: T[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};
