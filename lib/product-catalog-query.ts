import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SupportedCurrency } from "@@/lib/format-price";
import {
    getProductOnSaleFilter,
    getProductPriceRangeFilter,
} from "@@/lib/product-price-filter";

export interface CatalogQueryOptions {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sort?: string;
    inStockOnly?: boolean;
    onSaleOnly?: boolean;
    currency: SupportedCurrency;
    locale: string;
    page?: number;
    pageSize?: number;
}

function buildCatalogWhere({
    query,
    category,
    minPrice,
    maxPrice,
    inStockOnly,
    onSaleOnly,
    currency,
}: CatalogQueryOptions): Prisma.ProductWhereInput {
    const filters: Prisma.ProductWhereInput[] = [{ isActive: true }];

    if (query) {
        filters.push({
            OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
            ],
        });
    }

    if (category) {
        filters.push({
            category: {
                OR: [
                    { name: { equals: category, mode: "insensitive" } },
                    { nameEn: { equals: category, mode: "insensitive" } },
                ],
            },
        });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filters.push(getProductPriceRangeFilter(currency, minPrice, maxPrice));
    }

    if (inStockOnly) {
        filters.push({ stock: { gt: 0 } });
    }

    if (onSaleOnly) {
        filters.push(getProductOnSaleFilter(currency));
    }

    return filters.length === 1 ? filters[0] : { AND: filters };
}

function resolveCatalogPrice(
    product: {
        price: number;
        salePrice: number | null;
        prices: Array<{ currencyCode: string; price: number; salePrice: number | null }>;
        _count: { prices: number };
    },
    currency: SupportedCurrency,
): number | null {
    const selectedPrice = product.prices.find((entry) => entry.currencyCode === currency);
    if (selectedPrice) return selectedPrice.salePrice ?? selectedPrice.price;
    if (currency === "TRY" && product._count.prices === 0) {
        return product.salePrice ?? product.price;
    }
    return null;
}

function compareNewest(
    a: { id: string; createdAt: Date },
    b: { id: string; createdAt: Date },
): number {
    return b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id);
}

export interface CatalogOrderCandidate {
    id: string;
    price: number;
    salePrice: number | null;
    createdAt: Date;
    prices: Array<{ currencyCode: string; price: number; salePrice: number | null }>;
    _count: { prices: number };
}

export interface CatalogReviewStats {
    average: number;
    count: number;
}

export function filterAndSortCatalogCandidates({
    candidates,
    currency,
    minRating,
    sort,
    reviewStats,
}: {
    candidates: CatalogOrderCandidate[];
    currency: SupportedCurrency;
    minRating?: number;
    sort?: string;
    reviewStats: ReadonlyMap<string, CatalogReviewStats>;
}): CatalogOrderCandidate[] {
    const filteredCandidates = minRating === undefined
        ? [...candidates]
        : candidates.filter(
            (product) => (reviewStats.get(product.id)?.average ?? 0) >= minRating,
        );

    filteredCandidates.sort((a, b) => {
        if (sort === "price_asc" || sort === "price_desc") {
            const aPrice = resolveCatalogPrice(a, currency);
            const bPrice = resolveCatalogPrice(b, currency);

            if (aPrice === null && bPrice === null) return compareNewest(a, b);
            if (aPrice === null) return 1;
            if (bPrice === null) return -1;

            const priceDifference = sort === "price_asc"
                ? aPrice - bPrice
                : bPrice - aPrice;
            return priceDifference || compareNewest(a, b);
        }

        if (sort === "rating_desc") {
            const ratingDifference =
                (reviewStats.get(b.id)?.average ?? 0) -
                (reviewStats.get(a.id)?.average ?? 0);
            return ratingDifference || compareNewest(a, b);
        }

        if (sort === "reviews_desc") {
            const reviewDifference =
                (reviewStats.get(b.id)?.count ?? 0) -
                (reviewStats.get(a.id)?.count ?? 0);
            return reviewDifference || compareNewest(a, b);
        }

        if (sort === "oldest") {
            return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);
        }

        return compareNewest(a, b);
    });

    return filteredCandidates;
}

export async function getCatalogPage(options: CatalogQueryOptions) {
    const {
        currency,
        locale,
        minRating,
        sort,
        page = 1,
        pageSize = 12,
    } = options;
    const where = buildCatalogWhere(options);
    const skip = Math.max(0, page - 1) * pageSize;
    const requiresGlobalOrdering =
        minRating !== undefined ||
        sort === "price_asc" ||
        sort === "price_desc" ||
        sort === "rating_desc" ||
        sort === "reviews_desc";

    const include = {
        reviews: { select: { id: true, rating: true } },
        variants: { select: { id: true, color: true, colorHex: true, stock: true } },
        category: { select: { id: true, name: true, nameEn: true } },
        translations: { where: { locale }, select: { title: true, description: true } },
        prices: { select: { currencyCode: true, price: true, salePrice: true } },
    } satisfies Prisma.ProductInclude;

    let rawProducts;
    let hasMore: boolean;

    if (!requiresGlobalOrdering) {
        const orderBy: Prisma.ProductOrderByWithRelationInput =
            sort === "oldest"
                ? { createdAt: "asc" }
                : { createdAt: "desc" };
        const pageProducts = await prisma.product.findMany({
            where,
            include,
            orderBy: [orderBy, { id: "asc" }],
            skip,
            take: pageSize + 1,
        });

        hasMore = pageProducts.length > pageSize;
        rawProducts = hasMore ? pageProducts.slice(0, pageSize) : pageProducts;
    } else {
        const candidates = await prisma.product.findMany({
            where,
            select: {
                id: true,
                price: true,
                salePrice: true,
                createdAt: true,
                prices: {
                    where: { currencyCode: currency },
                    select: { currencyCode: true, price: true, salePrice: true },
                },
                _count: { select: { prices: true } },
            },
        });
        const candidateIds = candidates.map((product) => product.id);
        const needsReviewAggregates =
            minRating !== undefined || sort === "rating_desc" || sort === "reviews_desc";
        const reviewAggregates = needsReviewAggregates && candidateIds.length > 0
            ? await prisma.review.groupBy({
                by: ["productId"],
                where: { productId: { in: candidateIds } },
                _avg: { rating: true },
                _count: { _all: true },
            })
            : [];
        const reviewStats = new Map(
            reviewAggregates.map((aggregate) => [
                aggregate.productId,
                {
                    average: aggregate._avg.rating ?? 0,
                    count: aggregate._count._all,
                },
            ]),
        );

        const filteredCandidates = filterAndSortCatalogCandidates({
            candidates,
            currency,
            minRating,
            sort,
            reviewStats,
        });

        const pageCandidates = filteredCandidates.slice(skip, skip + pageSize + 1);
        hasMore = pageCandidates.length > pageSize;
        const pageIds = pageCandidates.slice(0, pageSize).map((product) => product.id);
        const pageProducts = pageIds.length > 0
            ? await prisma.product.findMany({
                where: { id: { in: pageIds } },
                include,
            })
            : [];
        const productById = new Map(pageProducts.map((product) => [product.id, product]));
        rawProducts = pageIds.flatMap((id) => {
            const product = productById.get(id);
            return product ? [product] : [];
        });
    }

    const products = rawProducts.map(({ translations, category, ...product }) => {
        const translation = translations[0];
        return {
            ...product,
            title: translation?.title ?? product.title,
            description: translation?.description ?? product.description,
            category: category
                ? {
                    ...category,
                    name: locale === "en" && category.nameEn ? category.nameEn : category.name,
                }
                : null,
        };
    });

    return { products, hasMore };
}
