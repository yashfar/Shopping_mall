import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CartAddSchema = z.object({
    productId: z.string().min(1, { error: "Product ID is required" }),
    quantity: z
        .number({ error: "Quantity must be a number" })
        .int({ error: "Quantity must be a whole number" })
        .min(1, { error: "Quantity must be at least 1" })
        .max(99, { error: "Quantity cannot exceed 99" }),
});

/**
 * POST /api/cart/add
 * Adds a product to cart or increases quantity if it already exists.
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validation = CartAddSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { productId, quantity } = validation.data;

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

        // Validate requested quantity does not exceed available stock
        if (quantity > product.stock) {
            return NextResponse.json(
                {
                    error: `Only ${product.stock} unit(s) available in stock`,
                },
                { status: 400 }
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
            const newQuantity = existingItem.quantity + quantity;

            // Ensure total cart quantity does not exceed stock
            if (newQuantity > product.stock) {
                return NextResponse.json(
                    {
                        error: `Cannot add ${quantity} more — only ${product.stock - existingItem.quantity} unit(s) remaining`,
                    },
                    { status: 400 }
                );
            }

            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                },
            });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: { product: true },
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
