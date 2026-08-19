"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { trackEvent } from "@/lib/analytics/events";
import { getServerSnapshot, getSnapshot, setItems, subscribe } from "@/lib/cart/store";
import type { CartItem } from "@/lib/cart/types";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity: number) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        const maxQty = Math.max(0, item.stock);
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, maxQty);
          return prev.map((i) =>
            i.productId === item.productId ? { ...i, quantity: nextQty } : i,
          );
        }
        const nextQty = Math.min(Math.max(quantity, 1), maxQty);
        if (nextQty <= 0) return prev;
        return [...prev, { ...item, quantity: nextQty }];
      });
      trackEvent("add_to_cart", { product_id: item.productId, quantity });
    },
    [],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(Math.max(quantity, 0), Math.max(0, i.stock)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    trackEvent("remove_from_cart", { product_id: productId });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    itemCount,
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
