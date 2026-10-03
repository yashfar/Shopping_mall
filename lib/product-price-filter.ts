import type { Prisma } from "@/generated/prisma/client";
import type { SupportedCurrency } from "@@/lib/format-price";

export function parsePriceFilterAmount(value?: string | null): number | undefined {
    if (!value) return undefined;

    const normalized = value.trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return undefined;

    const [whole, fraction = ""] = normalized.split(".");
    const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

    return Number.isSafeInteger(amount) ? amount : undefined;
}

export function getProductPriceRangeFilter(
    currency: SupportedCurrency,
    minPrice?: number,
    maxPrice?: number,
): Prisma.ProductWhereInput {
    const price: Prisma.IntFilter = {};
    if (minPrice !== undefined) price.gte = minPrice;
    if (maxPrice !== undefined) price.lte = maxPrice;

    if (currency === "TRY") {
        return {
            AND: [
                {
                    OR: [
                        { prices: { some: { currencyCode: "TRY", price } } },
                        { prices: { none: {} }, price },
                    ],
                },
            ],
        };
    }

    return {
        prices: {
            some: {
                currencyCode: currency,
                price,
            },
        },
    };
}

export function getProductOnSaleFilter(
    currency: SupportedCurrency,
): Prisma.ProductWhereInput {
    if (currency === "TRY") {
        return {
            OR: [
                {
                    prices: {
                        some: {
                            currencyCode: "TRY",
                            salePrice: { not: null },
                        },
                    },
                },
                {
                    prices: { none: {} },
                    salePrice: { not: null },
                },
            ],
        };
    }

    return {
        prices: {
            some: {
                currencyCode: currency,
                salePrice: { not: null },
            },
        },
    };
}
