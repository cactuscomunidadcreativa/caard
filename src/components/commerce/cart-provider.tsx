"use client";

/**
 * CAARD - Cart Provider
 * Context provider for shopping cart state management.
 * Logged-in users sync with /api/cart; guests use localStorage.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSession } from "next-auth/react";

export interface CartItemData {
  id: string;
  itemType: "CART_COURSE" | "CART_PRODUCT" | "CART_LAUDO" | "CART_SUBSCRIPTION";
  courseId?: string | null;
  productId?: string | null;
  laudoId?: string | null;
  quantity: number;
  priceCents: number;
  currency: string;
  title: string;
  image?: string | null;
  slug?: string | null;
}

interface CartContextValue {
  items: CartItemData[];
  addItem: (item: Omit<CartItemData, "id">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "caard-cart";

function getLocalCart(): CartItemData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCart(items: CartItemData[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = status === "authenticated" && !!session?.user;

  // Fetch cart on mount
  useEffect(() => {
    async function loadCart() {
      setIsLoading(true);
      if (isAuthenticated) {
        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            setItems(data.items ?? []);
          }
        } catch {
          // Fallback to local on error
          setItems(getLocalCart());
        }

        // Merge localStorage cart into DB on login
        const localItems = getLocalCart();
        if (localItems.length > 0) {
          for (const item of localItems) {
            try {
              await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
              });
            } catch {
              // Silently skip merge failures
            }
          }
          localStorage.removeItem(STORAGE_KEY);
          // Re-fetch merged cart
          try {
            const res = await fetch("/api/cart");
            if (res.ok) {
              const data = await res.json();
              setItems(data.items ?? []);
            }
          } catch {
            // Keep what we have
          }
        }
      } else if (status !== "loading") {
        setItems(getLocalCart());
      }
      setIsLoading(false);
    }
    if (status !== "loading") {
      loadCart();
    }
  }, [isAuthenticated, status]);

  const addItem = useCallback(
    async (item: Omit<CartItemData, "id">) => {
      if (isAuthenticated) {
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          if (res.ok) {
            const data = await res.json();
            setItems((prev) => [...prev, data.item]);
            return;
          }
        } catch {
          // Fall through to local
        }
      }
      const newItem: CartItemData = { ...item, id: generateId() };
      setItems((prev) => {
        const updated = [...prev, newItem];
        setLocalCart(updated);
        return updated;
      });
    },
    [isAuthenticated]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (isAuthenticated) {
        try {
          await fetch(`/api/cart/${id}`, { method: "DELETE" });
        } catch {
          // Continue with local removal
        }
      }
      setItems((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        if (!isAuthenticated) setLocalCart(updated);
        return updated;
      });
    },
    [isAuthenticated]
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (quantity < 1) return removeItem(id);
      if (isAuthenticated) {
        try {
          await fetch(`/api/cart/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity }),
          });
        } catch {
          // Continue with local update
        }
      }
      setItems((prev) => {
        const updated = prev.map((i) =>
          i.id === id ? { ...i, quantity } : i
        );
        if (!isAuthenticated) setLocalCart(updated);
        return updated;
      });
    },
    [isAuthenticated, removeItem]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await fetch("/api/cart", { method: "DELETE" });
      } catch {
        // Continue with local clear
      }
    }
    setItems([]);
    if (!isAuthenticated) localStorage.removeItem(STORAGE_KEY);
  }, [isAuthenticated]);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      isLoading,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, isLoading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
