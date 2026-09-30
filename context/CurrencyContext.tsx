"use client";

import { createContext, useContext, useMemo } from "react";
import { formatPrice, SupportedCurrency } from "@@/lib/format-price";

export type PriceEntry = {
    currencyCode: string;
    price: number;
    salePrice?: number | null;
};

export type ResolvedPrice = {
    price: number;
    salePrice: number | null;
    currencyCode: SupportedCurrency;
};

type CurrencyContextType = {
    currency: SupportedCurrency;
    formatPrice: (amount: number) => string;
    formatResolvedPrice: (resolved: ResolvedPrice) => string;
    /**
     * Resolves the best price for the current currency.
     * Falls back to TRY when no matching currency price exists.
     * Returns null only when there are no prices at all.
     */
    resolveProductPrice: (product: {
        price: number;
        salePrice?: number | null;
        prices?: PriceEntry[];
    }) => ResolvedPrice | null;
};

const CurrencyContext = createContext<CurrencyContextType>({
    currency: "TRY",
    formatPrice: (a) => formatPrice(a, "TRY"),
    formatResolvedPrice: (r) => formatPrice(r.price, r.currencyCode),
    resolveProductPrice: (p) => ({ price: p.price, salePrice: p.salePrice ?? null, currencyCode: "TRY" }),
});

export function CurrencyProvider({
    children,
    currency,
}: {
    children: React.ReactNode;
    currency: SupportedCurrency;
}) {
    const value = useMemo<CurrencyContextType>(
        () => ({
            currency,
            formatPrice: (amount: number) => formatPrice(amount, currency),
            formatResolvedPrice: (resolved: ResolvedPrice) => formatPrice(resolved.price, resolved.currencyCode),
            resolveProductPrice: (product) => {
                if (product.prices && product.prices.length > 0) {
                    const entry = product.prices.find((p) => p.currencyCode === currency);
                    if (entry) {
                        return { price: entry.price, salePrice: entry.salePrice ?? null, currencyCode: currency };
                    }
                    // No entry for this currency — show dash
                    return null;
                }
                // No prices array at all — fall back to Product.price (TRY backward-compat)
                return { price: product.price, salePrice: product.salePrice ?? null, currencyCode: "TRY" };
            },
        }),
        [currency]
    );

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}
