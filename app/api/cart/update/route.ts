import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cart/update
 * Updates quantity of a product in cart
 * If quantity <= 0, removes the item
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { productId, quantity } = await req.json();

        if (!productId || quantity === undefined) {
            return NextResponse.json(
                { error: "Product ID and quantity are required" },
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

        // Find cart item
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

        // If quantity <= 0, remove item
        if (quantity <= 0) {
            await prisma.cartItem.delete({
                where: { id: cartItem.id },
            });
        } else {
            // Update quantity
            await prisma.cartItem.update({
                where: { id: cartItem.id },
                data: { quantity },
            });
        }

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
        console.error("Error updating cart:", error);
        return NextResponse.json(
            { error: "Failed to update cart" },
            { status: 500 }
        );
    }
}
