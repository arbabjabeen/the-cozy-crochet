"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { type Product } from "@/lib/catalog";

export type CartItem = {
  product: Product;
  quantity: number;
  color?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, silent?: boolean) => void;
  removeFromCart: (slug: string) => void;
  updateQuantity: (slug: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalCount: number;
  giftWrap: boolean;
  setGiftWrap: (val: boolean) => void;
  isLoaded: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "the_cozy_crochet_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [giftWrap, setGiftWrap] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    try {
      // Save compact cart items without multi-megabyte base64 images to prevent QuotaExceededError
      const compactItems = items.map((item) => {
        const img = item.product.image;
        const isHugeBase64 = typeof img === "string" && img.startsWith("data:") && img.length > 500;
        return {
          ...item,
          product: {
            ...item.product,
            image: isHugeBase64 ? "/assets/cloud-throw.jpg" : img,
          },
        };
      });
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(compactItems));
    } catch (err) {
      console.warn("Could not persist cart to localStorage:", err);
    }
  }, [items, isLoaded]);

  const addToCart = (product: Product, quantity = 1, color = "Sage", silent = false) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.slug === product.slug);
      if (existingIdx > -1) {
        const existing = prev[existingIdx];
        if (!existing) return prev;
        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          quantity: existing.quantity + quantity,
        };
        return updated;
      }
      return [...prev, { product, quantity, color }];
    });

    if (!silent) {
      toast.success(`${product.name} added to your bag!`, {
        description: `Quantity: ${quantity} · Complimentary wrap included.`,
      });
    }
  };

  const removeFromCart = (slug: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product.slug === slug);
      if (item) {
        toast.info(`Removed ${item.product.name} from bag`);
      }
      return prev.filter((i) => i.product.slug !== slug);
    });
  };

  const updateQuantity = (slug: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.slug === slug) {
          const newQ = item.quantity + delta;
          return { ...item, quantity: Math.max(1, newQ) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalCount,
        giftWrap,
        setGiftWrap,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
