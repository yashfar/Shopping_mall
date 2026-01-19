import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cart/add
 * Adds a product to cart or increases quantity if already exists
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { productId, quantity = 1 } = await req.json();

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        // Verify product exists and is active
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product || !product.isActive) {
            return NextResponse.json(
                { error: "Product not found or inactive" },
                { status: 404 }
            );
        }

        // Find or create cart
        let cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId: session.user.id },
            });
        }

        // Check if item already exists in cart
        const existingItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId,
                },
            },
        });

        if (existingItem) {
            // Increase quantity
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity,
                },
            });
        } else {
            // Create new cart item
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                },
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
        console.error("Error adding to cart:", error);
        return NextResponse.json(
            { error: "Failed to add to cart" },
            { status: 500 }
        );
    }
}
