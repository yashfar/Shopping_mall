import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSortOrder } from "@@/lib/sort-utils";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "12");

        // Filters
        const query = searchParams.get("q") || "";
        const category = searchParams.get("category") || "";
        const minPrice = searchParams.get("min")
            ? parseFloat(searchParams.get("min")!) * 100
            : undefined;
        const maxPrice = searchParams.get("max")
            ? parseFloat(searchParams.get("max")!) * 100
            : undefined;
        const minRating = searchParams.get("rating")
            ? parseInt(searchParams.get("rating")!)
            : undefined;
        const sort = searchParams.get("sort") || undefined;

        // Build where clause
        const whereClause: any = {
            isActive: true,
        };

        // Search query filter
        if (query) {
            whereClause.OR = [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
            ];
        }

        // Category filter
        if (category) {
            whereClause.category = { name: category };
        }

        // Price filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            whereClause.price = {};
            if (minPrice !== undefined) {
                whereClause.price.gte = minPrice;
            }
            if (maxPrice !== undefined) {
                whereClause.price.lte = maxPrice;
            }
        }

        // Calculate skip and take
        const skip = (page - 1) * pageSize;
        const take = pageSize + 1; // Fetch one extra to check if there are more

        // Fetch products
        const products = await prisma.product.findMany({
            where: whereClause,
            include: {
                reviews: {
                    select: {
                        id: true,
                        rating: true,
                    },
                },
            },
            orderBy: getSortOrder(sort),
            skip,
            take,
        });

        // Filter by rating if needed
        let filteredProducts = minRating
            ? products.filter((product) => {
                if (product.reviews.length === 0) return false;
                const avgRating =
                    product.reviews.reduce((sum, r) => sum + r.rating, 0) /
                    product.reviews.length;
                return avgRating >= minRating;
            })
            : products;

        // Check if there are more products
        const hasMore = filteredProducts.length > pageSize;

        // Remove the extra product if it exists
        if (hasMore) {
            filteredProducts = filteredProducts.slice(0, pageSize);
        }

        return NextResponse.json({
            products: filteredProducts,
            hasMore,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
