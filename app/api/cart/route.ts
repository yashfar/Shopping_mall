
import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { getPaymentConfig } from "@/lib/payment-config";
import { calculateCartTotals } from "@@/lib/payment-utils";

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
        // First verify user exists in database
        const userExists = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true },
        });

        if (!userExists) {
            console.error(`User ${session.user.id} not found in database`);
            return NextResponse.json(
                { error: "User not found in database. Please try logging out and logging in again." },
                { status: 404 }
            );
        }

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

        const config = await getPaymentConfig();
        const totals = calculateCartTotals(cart.items, config);

        return NextResponse.json({ cart, config, totals });
    } catch (error) {
        console.error("Error fetching cart:", error);
        return NextResponse.json(
            { error: "Failed to fetch cart" },
            { status: 500 }
        );
    }
}
