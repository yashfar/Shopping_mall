import { prisma } from "@/lib/prisma";
import ProductCatalog from "@@/components/ProductCatalog";
import { getSortOrder, sortProducts } from "@@/lib/sort-utils";
import { notFound } from "next/navigation";

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ sort?: string }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const { sort } = await searchParams;
    const categoryName = decodeURIComponent(slug);

    // Check if category exists
    const categoryExists = await prisma.product.findFirst({
        where: { category: categoryName },
    });

    if (!categoryExists) {
        notFound();
    }

    // Fetch products
    const products = await prisma.product.findMany({
        where: {
            category: categoryName,
            isActive: true,
        },
        include: {
            reviews: { select: { id: true, rating: true } },
        },
        orderBy: getSortOrder(sort),
        take: 12,
    });

    const sortedProducts = sortProducts(products, sort);

    // Fetch unique categories
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
            initialProducts={sortedProducts}
            categories={categories}
            queryParams={{ category: categoryName, sort }}
            title={categoryName}
            description={`Browse all ${categoryName} products`}
        />
    );
}

export async function generateMetadata({ params }: CategoryPageProps) {
    const { slug } = await params;
    const categoryName = decodeURIComponent(slug);

    return {
        title: `${categoryName} - My Store`,
        description: `Browse all ${categoryName} products in our store`,
    };
}
