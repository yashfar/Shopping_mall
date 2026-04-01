import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cart/remove
 * Removes a cart item by cartItemId.
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { cartItemId } = await req.json();

        if (!cartItemId) {
            return NextResponse.json(
                { error: "cartItemId is required" },
                { status: 400 }
            );
        }

        const cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
        });

        if (!cart) {
            return NextResponse.json({ error: "Cart not found" }, { status: 404 });
        }

        const cartItem = await prisma.cartItem.findFirst({
            where: { id: cartItemId, cartId: cart.id },
        });

        if (!cartItem) {
            return NextResponse.json(
                { error: "Item not found in cart" },
                { status: 404 }
            );
        }

        await prisma.cartItem.delete({ where: { id: cartItem.id } });

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: {
                        product: true,
                        variant: true,
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
