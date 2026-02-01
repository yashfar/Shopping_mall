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
    const category = await prisma.category.findFirst({
        where: { name: { equals: categoryName, mode: "insensitive" } },
    });

    if (!category) {
        notFound();
    }

    // Fetch products
    const products = await prisma.product.findMany({
        where: {
            categoryId: category.id,
            isActive: true,
        },
        include: {
            reviews: { select: { id: true, rating: true } },
            category: true,
        },
        orderBy: getSortOrder(sort),
        take: 12,
    });

    const sortedProducts = sortProducts(products, sort);

    // Fetch all categories for filter
    const allCategories = await prisma.category.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
    });

    const categories = allCategories.map((c) => c.name);

    return (
        <ProductCatalog
            initialProducts={sortedProducts}
            categories={categories}
            queryParams={{ category: categoryName, sort }}
            title={category.name} // Use the actual DB name for consistent casing
            description={`Browse all ${category.name} products`}
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
