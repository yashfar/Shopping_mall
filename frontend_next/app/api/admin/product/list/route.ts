import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/product/list
 * Get all products with images (Admin only)
 */
export async function GET() {
    const session = await auth();

    // Check authentication
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Forbidden: Admin access required" },
            { status: 403 }
        );
    }

    try {
        const products = await prisma.product.findMany({
            include: {
                images: true,
                _count: {
                    select: {
                        reviews: true,
                        cartItems: true,
                        orderItems: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
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
