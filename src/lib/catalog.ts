"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DEFAULT_SETTINGS, DEMO_MODE, isConfigured } from "./config";
import { supabase } from "./supabase";
import type { Banner, Catalog, Category, Product, Settings } from "./types";

/**
 * The whole public catalogue (products, categories, banners, settings) is
 * loaded once and kept in the phone's storage, so the store opens instantly
 * on repeat visits and search/filters work without waiting for the network.
 * A fresh copy is fetched in the background.
 */

type Status = "loading" | "ready" | "error" | "unconfigured";
interface State {
  data: Catalog | null;
  status: Status;
  refreshing: boolean;
}

const CACHE_KEY = "nb-catalog-v1";
const REFRESH_AFTER_MS = 60_000;

let state: State = { data: null, status: "loading", refreshing: false };
const SERVER_STATE: State = { data: null, status: "loading", refreshing: false };
const listeners = new Set<() => void>();
let started = false;
let inflight: Promise<void> | null = null;

function emit(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function readCache(): Catalog | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Catalog) : null;
  } catch {
    return null;
  }
}

function writeCache(c: Catalog) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

function normalizeProduct(raw: Record<string, unknown>): Product {
  const r = raw as unknown as Product & { images?: Product["images"] | null; attrs?: Product["attrs"] | null };
  return {
    ...r,
    attrs: r.attrs ?? {},
    images: [...(r.images ?? [])].sort((a, b) => a.sort - b.sort),
    price: r.price == null ? null : Number(r.price),
    old_price: r.old_price == null ? null : Number(r.old_price),
    quantity: Number(r.quantity ?? 0),
  };
}

async function fetchCatalog(): Promise<Catalog> {
  if (DEMO_MODE) {
    const { demoCatalog } = await import("./demo");
    return demoCatalog();
  }
  if (!isConfigured) throw new Error("SUPABASE_NOT_CONFIGURED");
  const sb = supabase();
  const [p, c, b, s] = await Promise.all([
    sb
      .from("products")
      .select("*, images:product_images(path,thumb,sort)")
      .eq("is_visible", true)
      .order("created_at", { ascending: false }),
    sb.from("categories").select("id,slug,name,icon,sort").eq("is_visible", true).order("sort"),
    sb.from("banners").select("id,title,subtitle,image,link,sort").eq("is_active", true).order("sort"),
    sb.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const err = p.error || c.error || b.error || s.error;
  if (err) throw new Error(err.message);
  return {
    products: (p.data ?? []).map(normalizeProduct),
    categories: (c.data ?? []) as Category[],
    banners: (b.data ?? []) as Banner[],
    settings: { ...DEFAULT_SETTINGS, ...stripNulls((s.data ?? {}) as Partial<Settings>) },
    fetchedAt: Date.now(),
  };
}

function stripNulls<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== "")) as Partial<T>;
}

export function refreshCatalog(): Promise<void> {
  if (inflight) return inflight;
  emit({ refreshing: true });
  inflight = fetchCatalog()
    .then((data) => {
      writeCache(data);
      emit({ data, status: "ready", refreshing: false });
    })
    .catch((e: Error) => {
      const unconfigured = e.message === "SUPABASE_NOT_CONFIGURED";
      // keep showing the saved copy if we have one (weak or no internet)
      emit({
        status: state.data ? "ready" : unconfigured ? "unconfigured" : "error",
        refreshing: false,
      });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const cached = DEMO_MODE ? null : readCache();
  if (cached) state = { data: cached, status: "ready", refreshing: false };
  void refreshCatalog();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const age = Date.now() - (state.data?.fetchedAt ?? 0);
    if (age > REFRESH_AFTER_MS) void refreshCatalog();
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCatalog() {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    start();
  }, []);
  return {
    catalog: s.data,
    status: s.status,
    refreshing: s.refreshing,
    settings: s.data?.settings ?? DEFAULT_SETTINGS,
  };
}
