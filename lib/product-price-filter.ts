import type { Prisma } from "@/generated/prisma/client";
import type { SupportedCurrency } from "@@/lib/format-price";

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
