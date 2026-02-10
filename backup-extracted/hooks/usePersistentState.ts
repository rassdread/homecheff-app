'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type StorageType = 'local' | 'session';

interface PersistentStateOptions {
  /**
   * Storage type to use. Defaults to sessionStorage.
   */
  storage?: StorageType;
  /**
   * Optional TTL in milliseconds. When exceeded the stored value is cleared.
   */
  ttl?: number;
  /**
   * Version number for invalidating old payloads.
   */
  version?: number;
  /**
   * Toggle persistence. When disabled the hook behaves like useState.
   */
  enabled?: boolean;
  /**
   * Optional prefix applied to the storage key.
   */
  keyPrefix?: string;
}

interface PersistentStateMeta {
  /**
   * Clears the stored value and resets local state to the initial value.
   */
  reset: () => void;
  /**
   * True once the hook has attempted to hydrate from storage.
   */
  isHydrated: boolean;
  /**
   * Final key used in storage (handy for debugging).
   */
  storageKey: string;
}

type SetStateAction<T> = T | ((prevState: T) => T);

interface PersistedPayload<T> {
  value: T;
  version: number;
  timestamp: number;
}

function getStorageFromWindow(storage: StorageType): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return storage === 'local' ? window.localStorage : window.sessionStorage;
  } catch (error) {
    console.warn('⚠️ Storage unavailable:', error);
    return null;
  }
}

export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: PersistentStateOptions = {}
): [T, (value: SetStateAction<T>) => void, PersistentStateMeta] {
  const {
    storage = 'session',
    ttl,
    version = 1,
    enabled = true,
    keyPrefix,
  } = options;

  const storageKey = useMemo(
    () => (keyPrefix ? `${keyPrefix}:${key}` : key),
    [key, keyPrefix]
  );

  const storageRef = useRef<Storage | null>(null);
  const hasHydratedRef = useRef(false);

  const [value, setValue] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(!enabled);

  // Hydrate from storage
  useEffect(() => {
    if (!enabled) {
      setIsHydrated(true);
      return;
    }

    const storageInstance = getStorageFromWindow(storage);
    storageRef.current = storageInstance;

    if (!storageInstance) {
      setIsHydrated(true);
      return;
    }

    try {
      const raw = storageInstance.getItem(storageKey);
      if (!raw) {
        setValue(defaultValue);
        setIsHydrated(true);
        hasHydratedRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw) as PersistedPayload<T>;
      const isExpired =
        typeof ttl === 'number'
          ? Date.now() - parsed.timestamp > ttl
          : false;
      const versionMismatch = parsed.version !== version;

      if (isExpired || versionMismatch) {
        storageInstance.removeItem(storageKey);
        setValue(defaultValue);
      } else {
        setValue(parsed.value);
      }
    } catch (error) {
      console.warn('⚠️ Failed to hydrate persistent state:', error);
      setValue(defaultValue);
    } finally {
      setIsHydrated(true);
      hasHydratedRef.current = true;
    }
  }, [defaultValue, enabled, storage, storageKey, ttl, version]);

  // Persist whenever the value changes
  useEffect(() => {
    if (!enabled || !isHydrated || !storageRef.current || !hasHydratedRef.current) {
      return;
    }

    try {
      const payload: PersistedPayload<T> = {
        value,
        version,
        timestamp: Date.now(),
      };
      storageRef.current.setItem(storageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn('⚠️ Failed to persist state:', error);
    }
  }, [enabled, isHydrated, storageKey, value, version]);

  const setPersistentValue = useCallback(
    (next: SetStateAction<T>) => {
      setValue((prev) =>
        typeof next === 'function' ? (next as (value: T) => T)(prev) : next
      );
    },
    []
  );

  const reset = useCallback(() => {
    setValue(defaultValue);

    if (!storageRef.current) {
      return;
    }

    try {
      storageRef.current.removeItem(storageKey);
    } catch (error) {
      console.warn('⚠️ Failed to reset persistent state:', error);
    }
  }, [defaultValue, storageKey]);

  return [
    value,
    setPersistentValue,
    {
      reset,
      isHydrated,
      storageKey,
    },
  ];
}





