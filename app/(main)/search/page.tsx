import { prisma } from "@/lib/prisma";
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

    const whereClause: any = { isActive: true };

    if (query) {
        whereClause.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
        ];
    }

    if (category) whereClause.category = category;

    if (minPrice !== undefined || maxPrice !== undefined) {
        whereClause.price = {};
        if (minPrice !== undefined) whereClause.price.gte = minPrice;
        if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
    }

    const products = await prisma.product.findMany({
        where: whereClause,
        include: {
            reviews: { select: { id: true, rating: true } },
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

    const allCategories = await prisma.product.findMany({
        where: { isActive: true, category: { not: null } },
        select: { category: true },
        distinct: ["category"],
    });

    const categories = allCategories
        .map((p) => p.category)
        .filter((c): c is string => c !== null)
        .sort();

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
            }}
            title={query ? `Results for "${query}"` : "Search Results"}
            description={query ? `Found ${filteredProducts.length} results` : "Search our collection"}
        />
    );
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || "";

    return {
        title: query ? `Search: ${query} - My Store` : "Search Products - My Store",
        description: query
            ? `Search results for "${query}"`
            : "Search and browse all products in our store",
    };
}
