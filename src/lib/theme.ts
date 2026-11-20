"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    current,
    () => "light",
  );
}

export function toggleTheme() {
  const next: Theme = current() === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem("nb-theme", JSON.stringify(next));
  } catch {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", next === "dark" ? "#0f0d1e" : "#ffffff");
  listeners.forEach((l) => l());
}

/** Runs before first paint (inlined in <head>) so there is no white flash in dark mode. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=JSON.parse(localStorage.getItem('nb-theme')||'null');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;
