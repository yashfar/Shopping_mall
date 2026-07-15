"use client";

import { useCurrency } from "@@/context/CurrencyContext";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { SupportedCurrency } from "@@/lib/format-price";

export default function CurrencySwitcher({ compact = false }: { compact?: boolean }) {
    const { currency } = useCurrency();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const switchCurrency = (next: SupportedCurrency) => {
        if (next === currency) return;
        document.cookie = `CURRENCY=${next};path=/;max-age=31536000;SameSite=Lax`;
        startTransition(() => {
            router.refresh();
        });
    };

    if (compact) {
        return (
            <button
                onClick={() => switchCurrency(currency === "TRY" ? "USD" : "TRY")}
                disabled={isPending}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#1A1A1A] transition-all duration-200 hover:bg-[rgba(200,16,46,0.05)] hover:text-[#C8102E] border border-transparent hover:border-[rgba(200,16,46,0.1)] disabled:opacity-50"
                aria-label={`Switch to ${currency === "TRY" ? "USD" : "TRY"}`}
            >
                <span className="text-sm font-bold leading-none">{currency === "TRY" ? "₺" : "$"}</span>
                <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-black bg-white rounded-full w-4 h-4 flex items-center justify-center border border-gray-200 text-[#1A1A1A] shadow-sm leading-none">
                    {currency === "TRY" ? "$" : "₺"}
                </span>
            </button>
        );
    }

    return (
        <div
            className={`relative flex items-center bg-[#EFEFEF] rounded-full p-[3px] border border-[#E0E0E0] transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : ""}`}
        >
            {/* Sliding pill */}
            <div
                className="absolute top-[3px] h-[calc(100%-6px)] w-[calc(50%-3px)] bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out"
                style={{ left: currency === "TRY" ? "3px" : "calc(50%)" }}
            />

            <button
                onClick={() => switchCurrency("TRY")}
                className={`relative z-10 cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.78rem] font-bold tracking-wide transition-all duration-300 ${
                    currency === "TRY" ? "text-[#C8102E]" : "text-[#888] hover:text-[#444]"
                }`}
            >
                TRY
            </button>

            <button
                onClick={() => switchCurrency("USD")}
                className={`relative z-10 cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.78rem] font-bold tracking-wide transition-all duration-300 ${
                    currency === "USD" ? "text-[#C8102E]" : "text-[#888] hover:text-[#444]"
                }`}
            >
                USD
            </button>
        </div>
    );
}
