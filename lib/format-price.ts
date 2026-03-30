export type SupportedCurrency = "TRY" | "USD";

const CURRENCY_CONFIG: Record<SupportedCurrency, { locale: string }> = {
    TRY: { locale: "tr-TR" },
    USD: { locale: "en-US" },
};

/**
 * Formats a price stored in smallest unit (kuruş / cents) to a currency string.
 * Example: formatPrice(1999, "TRY") → "₺19,99"
 *          formatPrice(1999, "USD") → "$19.99"
 */
export function formatPrice(amount: number, currency: SupportedCurrency = "TRY"): string {
    const { locale } = CURRENCY_CONFIG[currency];
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount / 100);
}

/**
 * Determines currency from a country code.
 */
export function currencyFromCountry(country: string | null | undefined): SupportedCurrency {
    return country === "TR" ? "TRY" : "USD";
}
