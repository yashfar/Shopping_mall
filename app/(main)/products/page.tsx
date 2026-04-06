import { prisma } from "@/lib/prisma";
import ProductCatalog from "@@/components/ProductCatalog";
import { getSortOrder, sortProducts } from "@@/lib/sort-utils";
import { getTranslations, getLocale } from "next-intl/server";

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
    }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const t = await getTranslations("catalog");
    const locale = await getLocale();
    const params = await searchParams;
    const query = params.q || "";
    const category = params.category || "";
    const minPrice = params.min ? parseFloat(params.min) * 100 : undefined; // Convert to cents
    const maxPrice = params.max ? parseFloat(params.max) * 100 : undefined; // Convert to cents
    const minRating = params.rating ? parseInt(params.rating) : undefined;
    const sort = params.sort;
    const inStockOnly = params.inStock === "true";
    const onSaleOnly = params.onSale === "true";

    // Build Prisma where clause
    const whereClause: any = {
        isActive: true,
    };

    // Search query
    if (query) {
        whereClause.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
        ];
    }

    // Category filter (match TR or EN name)
    if (category) {
        whereClause.category = {
            OR: [
                { name: { equals: category, mode: "insensitive" } },
                { nameEn: { equals: category, mode: "insensitive" } },
            ],
        };
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        whereClause.price = {};
        if (minPrice !== undefined) whereClause.price.gte = minPrice;
        if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
    }

    // In stock filter
    if (inStockOnly) {
        whereClause.stock = { gt: 0 };
    }

    // On sale filter
    if (onSaleOnly) {
        whereClause.salePrice = { not: null };
    }

    // Fetch initial page of products (12 items)
    const rawProducts = await prisma.product.findMany({
        where: whereClause,
        include: {
            reviews: { select: { id: true, rating: true } },
            variants: { select: { id: true, color: true, colorHex: true, stock: true } },
            category: { select: { id: true, name: true, nameEn: true } },
            translations: { where: { locale }, select: { title: true, description: true } },
        },
        orderBy: getSortOrder(sort),
        take: 12,
    });

    const products = rawProducts.map(({ translations, category, ...p }) => {
        const tr = translations[0];
        return {
            ...p,
            title: tr?.title ?? p.title,
            description: tr?.description ?? p.description,
            category: category ? { ...category, name: locale === "en" && category.nameEn ? category.nameEn : category.name } : null,
        };
    });

    // Filter by rating (client-side)
    let filteredProducts = minRating
        ? products.filter((product) => {
            if (product.reviews.length === 0) return false;
            const avgRating =
                product.reviews.reduce((sum, r) => sum + r.rating, 0) /
                product.reviews.length;
            return avgRating >= minRating;
        })
        : products;

    // Apply sorting
    filteredProducts = sortProducts(filteredProducts, sort);

    // Fetch all categories for the sidebar (locale-aware)
    const allCategories = await prisma.category.findMany({
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
                min: params.min,
                max: params.max,
                rating: params.rating,
                sort,
                inStock: params.inStock,
                onSale: params.onSale,
            }}
            title={t("allProducts")}
            description={t("browseCollection")}
        />
    );
}
