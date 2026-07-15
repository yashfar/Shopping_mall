"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface WishlistContextType {
    wishlistIds: Set<string>;
    wishlistCount: number;
    toggle: (productId: string) => Promise<void>;
    isWishlisted: (productId: string) => boolean;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const t = useTranslations("wishlistContext");
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

    const refreshWishlist = useCallback(async () => {
        try {
            const res = await fetch("/api/wishlist");
            if (res.ok) {
                const data = await res.json();
                setWishlistIds(new Set(data.map((item: { productId: string }) => item.productId)));
            }
            // 401 = not logged in, silently ignore
        } catch {
            // network error, ignore
        }
    }, []);

    useEffect(() => {
        refreshWishlist();
    }, [refreshWishlist]);

    const toggle = async (productId: string) => {
        const wasWishlisted = wishlistIds.has(productId);

        // Optimistic update
        setWishlistIds((prev) => {
            const next = new Set(prev);
            if (wasWishlisted) next.delete(productId);
            else next.add(productId);
            return next;
        });

        try {
            const res = await fetch("/api/wishlist/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId }),
            });

            if (res.status === 401) {
                // Roll back and redirect hint via toast
                setWishlistIds((prev) => {
                    const next = new Set(prev);
                    if (wasWishlisted) next.add(productId);
                    else next.delete(productId);
                    return next;
                });
                toast.error(t("signInRequired"));
                return;
            }

            if (!res.ok) throw new Error();

            const data = await res.json();
            toast.success(data.wishlisted ? t("added") : t("removed"));
        } catch {
            // Roll back on error
            setWishlistIds((prev) => {
                const next = new Set(prev);
                if (wasWishlisted) next.add(productId);
                else next.delete(productId);
                return next;
            });
            toast.error(t("failedToUpdate"));
        }
    };

    const isWishlisted = (productId: string) => wishlistIds.has(productId);

    return (
        <WishlistContext.Provider value={{
            wishlistIds,
            wishlistCount: wishlistIds.size,
            toggle,
            isWishlisted,
            refreshWishlist,
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}
