import { useState, useEffect } from 'react';

/**
 * A safe hook to access Zustand store with persistence.
 * Prevents hydration mismatch by ensuring state is only returned after mount.
 *
 * @param store The Zustand store hook
 * @param callback A selector function to get specific state
 */
export function useStore<T, F>(
  store: (cb: (state: T) => unknown) => unknown,
  callback: (state: T) => F
) {
  const result = store(callback) as F;
  const [data, setData] = useState<F>();

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
}
