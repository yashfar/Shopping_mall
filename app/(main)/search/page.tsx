import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import ProductCatalog from "@@/components/ProductCatalog";
import { getSortOrder, sortProducts } from "@@/lib/sort-utils";
import type { SupportedCurrency } from "@@/lib/format-price";
import { getProductPriceRangeFilter, parsePriceFilterAmount } from "@@/lib/product-price-filter";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

interface SearchPageProps {
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const locale = await getLocale();
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

  const whereClause: Prisma.ProductWhereInput = {
    isActive: true,
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    }),
    ...(category && {
      category: {
        OR: [
          { name: { equals: category, mode: "insensitive" } },
          { nameEn: { equals: category, mode: "insensitive" } },
        ],
      },
    }),
    ...((minPrice !== undefined || maxPrice !== undefined) && getProductPriceRangeFilter(currency, minPrice, maxPrice)),
    ...(inStockOnly && { stock: { gt: 0 } }),
    ...(onSaleOnly && { salePrice: { not: null } }),
  };

  const rawProducts = await prisma.product.findMany({
    where: whereClause,
    include: {
      reviews: { select: { id: true, rating: true } },
      variants: {
        select: { id: true, color: true, colorHex: true, stock: true },
      },
      category: { select: { id: true, name: true, nameEn: true } },
      translations: { where: { locale }, select: { title: true, description: true } },
      prices: { select: { currencyCode: true, price: true, salePrice: true } },
    },
    orderBy: getSortOrder(sort),
    take: 12,
  });

  const products = rawProducts.map(({ translations, category: productCategory, ...product }) => {
    const translation = translations[0];
    return {
      ...product,
      title: translation?.title ?? product.title,
      description: translation?.description ?? product.description,
      category: productCategory
        ? { ...productCategory, name: locale === "en" && productCategory.nameEn ? productCategory.nameEn : productCategory.name }
        : null,
    };
  });

  let filteredProducts = minRating
    ? products.filter((product) => {
        if (product.reviews.length === 0) return false;
        const avgRating =
          product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length;
        return avgRating >= minRating;
      })
    : products;

  filteredProducts = sortProducts(filteredProducts, sort);

  const allCategories = await prisma.category.findMany({
    where: {
      products: {
        some: { isActive: true },
      },
    },
    select: { name: true, nameEn: true },
    orderBy: { name: "asc" },
  });

  const categories = allCategories.map((c) => locale === "en" && c.nameEn ? c.nameEn : c.name);

  return (
    <ProductCatalog
      initialProducts={filteredProducts}
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
      title={query ? `Results for "${query}"` : "Search Results"}
      description={
        query
          ? `Found ${filteredProducts.length} results`
          : "Search our collection"
      }
      variant="homeGrid"
    />
  );
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";

  return {
    title: query
      ? `Search: ${query} - Creative Aventus`
      : "Search Products - Creative Aventus",
    description: query
      ? `Search results for "${query}"`
      : "Search and browse all products in our store",
  };
}
