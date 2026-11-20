"use client";

import { createStore } from "./store";
import type { Product } from "./types";

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  /** price when added; the latest price from the catalogue is preferred when available */
  price: number | null;
  qty: number;
}

const cart = createStore<CartItem[]>("nb-cart-v1", []);

export const useCart = cart.use;

export function addToCart(p: Product, qty = 1) {
  cart.set((items) => {
    const found = items.find((i) => i.id === p.id);
    const max = Math.max(1, p.quantity || 1);
    if (found) {
      return items.map((i) => (i.id === p.id ? { ...i, qty: Math.min(max, i.qty + qty) } : i));
    }
    return [...items, { id: p.id, sku: p.sku, name: p.name, price: p.price_on_request ? null : p.price, qty }];
  });
}

export function setQty(id: string, qty: number) {
  cart.set((items) =>
    qty <= 0 ? items.filter((i) => i.id !== id) : items.map((i) => (i.id === id ? { ...i, qty } : i)),
  );
}

export function removeFromCart(id: string) {
  cart.set((items) => items.filter((i) => i.id !== id));
}

export function clearCart() {
  cart.set([]);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.qty, 0);
}
