import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/products
 * Returns all products (admin only)
 */
export async function GET() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const products = await prisma.product.findMany({
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

/**
 * POST /api/admin/products
 * Creates a new product (admin only)
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { title, description, price, stock, isActive } = await req.json();

        // Validation
        if (!title || typeof price !== "number") {
            return NextResponse.json(
                { error: "Title and price are required" },
                { status: 400 }
            );
        }

        const product = await prisma.product.create({
            data: {
                title,
                description: description || null,
                price: Math.round(price), // Ensure integer (cents)
                stock: stock || 0,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
