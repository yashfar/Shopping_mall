import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/products/[id]
 * Get product details (admin only)
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                images: true,
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/products/[id]
 * Updates a product (admin only)
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const { title, description, price, stock, isActive, images, thumbnail, category } = await req.json();

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = Math.round(price);
        if (category !== undefined) updateData.category = category;
        if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

        // Handle stock updates with auto-toggle of isActive
        if (stock !== undefined) {
            updateData.stock = stock;
            if (stock <= 0) {
                updateData.isActive = false;
            } else {
                updateData.isActive = true; // Auto-activate if stock added? Maybe not always desired, but safe default
            }
        }

        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        // Database transaction to handle product update and image sync
        const product = await prisma.$transaction(async (tx) => {
            // Update basic fields
            const updated = await tx.product.update({
                where: { id },
                data: updateData,
            });

            // Handle image updates if provided
            if (images && Array.isArray(images)) {
                // Delete existing images
                await tx.productImage.deleteMany({
                    where: { productId: id },
                });

                // Create new images
                if (images.length > 0) {
                    await tx.productImage.createMany({
                        data: images.map((url: string) => ({
                            productId: id,
                            url: url,
                        })),
                    });
                }
            }

            return updated;
        });

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/products/[id]
 * Deletes a product (admin only)
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Product deleted" });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
