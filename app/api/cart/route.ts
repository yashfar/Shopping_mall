import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cart
 * Returns the current user's cart with items and product details
 */
export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Find or create cart for user
        let cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        // Create cart if it doesn't exist
        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    userId: session.user.id,
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        }

        return NextResponse.json({ cart });
    } catch (error) {
        console.error("Error fetching cart:", error);
        return NextResponse.json(
            { error: "Failed to fetch cart" },
            { status: 500 }
        );
    }
}
