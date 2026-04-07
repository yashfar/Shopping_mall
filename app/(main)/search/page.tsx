import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import ProductCatalog from "@@/components/ProductCatalog";
import { getSortOrder, sortProducts } from "@@/lib/sort-utils";

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
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const category = params.category || "";
  const minPrice = params.min ? parseFloat(params.min) * 100 : undefined;
  const maxPrice = params.max ? parseFloat(params.max) * 100 : undefined;
  const minRating = params.rating ? parseInt(params.rating) : undefined;
  const sort = params.sort;
  const inStockOnly = params.inStock === "true";
  const onSaleOnly = params.onSale === "true";

  const whereClause: Prisma.ProductWhereInput = {
    isActive: true,
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    }),
    ...(category && { category: { name: category } }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: { gte: minPrice, lte: maxPrice },
    }),
    ...(inStockOnly && { stock: { gt: 0 } }),
    ...(onSaleOnly && { salePrice: { not: null } }),
  };

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      reviews: { select: { id: true, rating: true } },
      variants: {
        select: { id: true, color: true, colorHex: true, stock: true },
      },
    },
    orderBy: getSortOrder(sort),
    take: 12,
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
    select: { name: true },
    orderBy: { name: "asc" },
  });

  const categories = allCategories.map((c) => c.name);

  return (
    <ProductCatalog
      initialProducts={filteredProducts}
      categories={categories}
      queryParams={{
        q: query,
        category,
        min: params.min,
        max: params.max,
        rating: params.rating,
        sort,
        inStock: params.inStock,
        onSale: params.onSale,
      }}
      title={query ? `Results for "${query}"` : "Search Results"}
      description={
        query
          ? `Found ${filteredProducts.length} results`
          : "Search our collection"
      }
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
