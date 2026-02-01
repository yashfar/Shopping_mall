import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateProductSchema = z.object({
    title: z.string().min(1, "Title is required").max(200).optional(),
    description: z.string().optional().nullable(),
    price: z.number().int().positive("Price must be positive").optional(),
    category: z.string().min(1, "Category is required").optional(),
    stock: z.number().int().min(0, "Stock cannot be negative").optional(),
    isActive: z.boolean().optional(),
    images: z.array(z.string().url()).optional(),
    thumbnail: z.string().url().optional().nullable(),
});

/**
 * PUT /api/admin/product/[id]
 * Update an existing product (Admin only)
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    // Check authentication
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Forbidden: Admin access required" },
            { status: 403 }
        );
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const validation = UpdateProductSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { title, description, price, category, stock, isActive, images, thumbnail } =
            validation.data;

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Update product with images in a transaction
        const product = await prisma.$transaction(async (tx) => {
            // Handle category - find or create if provided
            let categoryId: string | undefined | null = undefined;
            if (category !== undefined) {
                if (category === "" || category === null) {
                    categoryId = null;
                } else {
                    const categoryRecord = await tx.category.upsert({
                        where: { name: category },
                        update: {},
                        create: { name: category },
                    });
                    categoryId = categoryRecord.id;
                }
            }

            // Update the product
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    ...(title !== undefined && { title }),
                    ...(description !== undefined && { description }),
                    ...(price !== undefined && { price }),
                    ...(categoryId !== undefined && { categoryId }),
                    ...(stock !== undefined && { stock }),
                    ...(isActive !== undefined && { isActive }),
                    ...(thumbnail !== undefined && { thumbnail }),
                },
            });

            // If images array is provided, replace all images
            if (images !== undefined) {
                // Delete existing images
                await tx.productImage.deleteMany({
                    where: { productId: id },
                });

                // Create new images
                if (images.length > 0) {
                    await tx.productImage.createMany({
                        data: images.map((url) => ({
                            productId: id,
                            url,
                        })),
                    });
                }
            }

            // Fetch the complete product with images
            return await tx.product.findUnique({
                where: { id },
                include: {
                    images: true,
                },
            });
        });

        return NextResponse.json({
            message: "Product updated successfully",
            product,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/product/[id]
 * Delete a product (Admin only)
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    // Check authentication
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Forbidden: Admin access required" },
            { status: 403 }
        );
    }

    try {
        const { id } = await params;

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: {
                cartItems: true,
                orderItems: true,
            },
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Check if product is in any active carts or orders
        if (existingProduct.cartItems.length > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete product: It exists in active carts",
                    suggestion: "Consider deactivating the product instead",
                },
                { status: 409 }
            );
        }

        // Delete product (images will cascade delete automatically)
        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
