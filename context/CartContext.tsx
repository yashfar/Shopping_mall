"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface CartItem {
    id: string;
    quantity: number;
    product: { id: string; price: number; title: string };
}

interface CartContextType {
    cartCount: number;
    addToCart: (productId: string, quantity: number) => Promise<boolean | "unauthorized">;
    refreshCart: () => Promise<void>;
    isAnimating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartCount, setCartCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const refreshCart = useCallback(async () => {
        try {
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                const items: CartItem[] = data.cart?.items ?? [];
                const count = items.reduce((sum, item) => sum + item.quantity, 0);
                setCartCount(count);
            }
            // 401 is expected for unauthenticated visitors — silently ignore
        } catch (e) {
            console.error("Failed to refresh cart", e);
        }
    }, []);

    // Fetch cart count on mount
    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addToCart = async (productId: string, quantity: number): Promise<boolean | "unauthorized"> => {
        try {
            const res = await fetch("/api/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantity }),
            });

            if (res.status === 401) {
                toast.error("Please sign in to add items to cart");
                return "unauthorized";
            }

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Failed to add to cart");
                return false;
            }

            // Optimistic update on success
            setCartCount((prev) => prev + quantity);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 500);

            toast.success("Product added to cart");
            return true;
        } catch {
            // On network error, roll back the optimistic update by re-syncing
            // with the server rather than leaving a stale count.
            await refreshCart();
            toast.error("Error adding to cart");
            return false;
        }
    };

    return (
        <CartContext.Provider value={{ cartCount, addToCart, refreshCart, isAnimating }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
