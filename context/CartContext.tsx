"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface CartContextType {
    cartCount: number;
    addToCart: (productId: string, quantity: number) => Promise<boolean>;
    refreshCart: () => Promise<void>;
    isAnimating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartCount, setCartCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Initial fetch
    useEffect(() => {
        refreshCart();
    }, []);

    const refreshCart = useCallback(async () => {
        try {
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                const items = data.cart?.items || [];
                const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                setCartCount(count);
            }
        } catch (e) {
            console.error("Failed to refresh cart", e);
        }
    }, []);

    const addToCart = async (productId: string, quantity: number) => {
        // Optimistic update
        setCartCount((prev) => prev + quantity);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500); // Animation duration

        try {
            const res = await fetch("/api/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantity }),
            });

            if (!res.ok) {
                // Revert on failure
                setCartCount((prev) => prev - quantity);
                const data = await res.json();
                console.error("Failed to add:", data.error);
                toast.error(data.error || "Failed to add to cart");
                return false;
            }

            toast.success("Product added to cart");
            return true;
        } catch (e) {
            setCartCount((prev) => prev - quantity);
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
