import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cart/update
 * Updates quantity of a cart item by cartItemId.
 * If quantity <= 0, removes the item.
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { cartItemId, quantity } = await req.json();

        if (!cartItemId || quantity === undefined) {
            return NextResponse.json(
                { error: "cartItemId and quantity are required" },
                { status: 400 }
            );
        }

        // Find cart item (verify ownership via cart)
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

        if (quantity <= 0) {
            await prisma.cartItem.delete({ where: { id: cartItem.id } });
        } else {
            await prisma.cartItem.update({
                where: { id: cartItem.id },
                data: { quantity },
            });
        }

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
        console.error("Error updating cart:", error);
        return NextResponse.json(
            { error: "Failed to update cart" },
            { status: 500 }
        );
    }
}
