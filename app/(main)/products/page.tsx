import { prisma } from "@/lib/prisma";
import ProductCatalog from "@@/components/ProductCatalog";
import { getTranslations, getLocale } from "next-intl/server";
import type { SupportedCurrency } from "@@/lib/format-price";
import { parsePriceFilterAmount } from "@@/lib/product-price-filter";
import { getCatalogPage } from "@@/lib/product-catalog-query";
import { cookies } from "next/headers";

interface ProductsPageProps {
    searchParams: Promise<{
        q?: string;
        category?: string;
        min?: string;
        max?: string;
        rating?: string;
        sort?: string;
        inStock?: string;
        onSale?: string;
        priceCurrency?: string;
    }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const t = await getTranslations("catalog");
    const locale = await getLocale();
    const params = await searchParams;
    const query = params.q || "";
    const category = params.category || "";
    const minRating = params.rating ? parseInt(params.rating) : undefined;
    const sort = params.sort;
    const inStockOnly = params.inStock === "true";
    const onSaleOnly = params.onSale === "true";
    const cookieStore = await cookies();
    const currency: SupportedCurrency = cookieStore.get("CURRENCY")?.value === "USD" ? "USD" : "TRY";
    const isPriceCurrencyCurrent = !params.priceCurrency || params.priceCurrency === currency;
    const effectiveMin = isPriceCurrencyCurrent ? params.min : undefined;
    const effectiveMax = isPriceCurrencyCurrent ? params.max : undefined;
    const minPrice = parsePriceFilterAmount(effectiveMin);
    const maxPrice = parsePriceFilterAmount(effectiveMax);

    const { products, hasMore } = await getCatalogPage({
        query,
        category,
        minPrice,
        maxPrice,
        minRating,
        sort,
        inStockOnly,
        onSaleOnly,
        currency,
        locale,
    });

    // Fetch all categories for the sidebar (locale-aware)
    const allCategories = await prisma.category.findMany({
        select: { name: true, nameEn: true },
        orderBy: { name: "asc" },
    });

    const categories = allCategories.map((c) => locale === "en" && c.nameEn ? c.nameEn : c.name);

    return (
        <ProductCatalog
            initialProducts={products}
            initialHasMore={hasMore}
            categories={categories}
            locale={locale}
            queryParams={{
                q: query,
                category,
                min: effectiveMin,
                max: effectiveMax,
                rating: params.rating,
                sort,
                inStock: params.inStock,
                onSale: params.onSale,
                priceCurrency: isPriceCurrencyCurrent ? params.priceCurrency : undefined,
            }}
            title={t("allProducts")}
            description={t("browseCollection")}
            variant="homeGrid"
        />
    );
}
