import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products
 * Returns all active products (public)
 */
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                stock: {
                    gt: 0,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                title: true,
                description: true,
                price: true,
                stock: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
