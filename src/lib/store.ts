"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external store with optional localStorage persistence.
 * - The server render (static export) always sees `serverValue`.
 * - In the browser the saved value is read once, lazily, after hydration.
 */
export function createStore<T>(key: string | null, initial: T, serverValue: T = initial) {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    if (!key) return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {
      /* storage blocked or corrupt — keep the initial value */
    }
  }

  function save() {
    if (!key || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private mode — ignore */
    }
  }

  const store = {
    get(): T {
      load();
      return value;
    },
    set(next: T | ((prev: T) => T)) {
      load();
      value = typeof next === "function" ? (next as (p: T) => T)(value) : next;
      save();
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      // other tabs
      const onStorage = (e: StorageEvent) => {
        if (key && e.key === key && e.newValue) {
          try {
            value = JSON.parse(e.newValue) as T;
            l();
          } catch {}
        }
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(l);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
    use(): T {
      return useSyncExternalStore(store.subscribe, store.get, () => serverValue);
    },
  };
  return store;
}
