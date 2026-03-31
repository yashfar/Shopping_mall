"use client";

import { createContext, useContext, useMemo } from "react";
import { formatPrice, SupportedCurrency } from "@@/lib/format-price";

type CurrencyContextType = {
    currency: SupportedCurrency;
    formatPrice: (amount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType>({
    currency: "TRY",
    formatPrice: (a) => formatPrice(a, "TRY"),
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
