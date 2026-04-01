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
    variantId: z.string().optional().nullable(),
});

/**
 * POST /api/cart/add
 * Adds a product (with optional variant) to cart or increases quantity if already exists.
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

        const { productId, quantity, variantId } = validation.data;

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

        // If product has variants, a variantId is required
        const totalVariants = await prisma.productVariant.count({ where: { productId } });
        if (totalVariants > 0 && !variantId) {
            return NextResponse.json(
                { error: "Please select a color variant" },
                { status: 400 }
            );
        }

        // Determine available stock
        let availableStock: number;
        if (variantId) {
            const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
            if (!variant) {
                return NextResponse.json({ error: "Variant not found" }, { status: 404 });
            }
            availableStock = variant.stock;
        } else {
            availableStock = product.stock;
        }

        if (quantity > availableStock) {
            return NextResponse.json(
                { error: `Only ${availableStock} unit(s) available in stock` },
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

        // Check if item already exists in cart (same product + same variant)
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId,
                variantId: variantId ?? null,
            },
        });

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity > availableStock) {
                return NextResponse.json(
                    {
                        error: `Cannot add ${quantity} more — only ${availableStock - existingItem.quantity} unit(s) remaining`,
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
                    variantId: variantId ?? null,
                    quantity,
                },
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
        console.error("Error adding to cart:", error);
        return NextResponse.json(
            { error: "Failed to add to cart" },
            { status: 500 }
        );
    }
}
