import { NextResponse } from "next/server";
import type { SupportedCurrency } from "@@/lib/format-price";
import { parsePriceFilterAmount } from "@@/lib/product-price-filter";
import { getCatalogPage } from "@@/lib/product-catalog-query";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "12");
        const query = searchParams.get("q") || "";
        const category = searchParams.get("category") || "";
        const minRating = searchParams.get("rating") ? parseInt(searchParams.get("rating")!) : undefined;
        const sort = searchParams.get("sort") || undefined;
        const locale = searchParams.get("locale") || "tr";
        const inStockOnly = searchParams.get("inStock") === "true";
        const onSaleOnly = searchParams.get("onSale") === "true";
        const cookieStore = await cookies();
        const currency: SupportedCurrency = cookieStore.get("CURRENCY")?.value === "USD" ? "USD" : "TRY";
        const priceCurrency = searchParams.get("priceCurrency");
        const isPriceCurrencyCurrent = !priceCurrency || priceCurrency === currency;
        const minPrice = parsePriceFilterAmount(isPriceCurrencyCurrent ? searchParams.get("min") : undefined);
        const maxPrice = parsePriceFilterAmount(isPriceCurrencyCurrent ? searchParams.get("max") : undefined);

        const result = await getCatalogPage({
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
            page,
            pageSize,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
