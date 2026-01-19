import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cart/remove
 * Removes a product from cart
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        // Find user's cart
        const cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
        });

        if (!cart) {
            return NextResponse.json({ error: "Cart not found" }, { status: 404 });
        }

        // Find and delete cart item
        const cartItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId,
                },
            },
        });

        if (!cartItem) {
            return NextResponse.json(
                { error: "Item not found in cart" },
                { status: 404 }
            );
        }

        await prisma.cartItem.delete({
            where: { id: cartItem.id },
        });

        // Fetch updated cart
        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return NextResponse.json({ cart: updatedCart });
    } catch (error) {
        console.error("Error removing from cart:", error);
        return NextResponse.json(
            { error: "Failed to remove from cart" },
            { status: 500 }
        );
    }
}
