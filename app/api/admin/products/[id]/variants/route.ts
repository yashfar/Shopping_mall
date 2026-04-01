import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/products/[id]/variants
 * Returns all variants for a product.
 */
export async function GET(_req: Request, { params }: Params) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const variants = await prisma.productVariant.findMany({
        where: { productId: id },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ variants });
}

/**
 * POST /api/admin/products/[id]/variants
 * Creates a new variant for a product.
 */
export async function POST(req: Request, { params }: Params) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const { color, colorHex, stock, images } = await req.json();

        if (!color?.trim()) {
            return NextResponse.json({ error: "Color name is required" }, { status: 400 });
        }
        if (typeof stock !== "number" || stock < 0) {
            return NextResponse.json({ error: "Stock must be a non-negative number" }, { status: 400 });
        }

        const variant = await prisma.productVariant.create({
            data: {
                productId: id,
                color: color.trim(),
                colorHex: colorHex?.trim() || null,
                stock,
                images: Array.isArray(images) ? images : [],
            },
        });

        // If at least one variant has stock, ensure product is active
        if (stock > 0) {
            await prisma.product.update({
                where: { id },
                data: { isActive: true },
            });
        }

        return NextResponse.json({ variant }, { status: 201 });
    } catch (error) {
        console.error("Error creating variant:", error);
        return NextResponse.json({ error: "Failed to create variant" }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/products/[id]/variants
 * Updates an existing variant (pass variantId in body).
 */
export async function PATCH(req: Request, { params }: Params) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: productId } = await params;

    try {
        const { variantId, color, colorHex, stock, images } = await req.json();

        if (!variantId) {
            return NextResponse.json({ error: "variantId is required" }, { status: 400 });
        }

        const updateData: any = {};
        if (color !== undefined) updateData.color = color.trim();
        if (colorHex !== undefined) updateData.colorHex = colorHex?.trim() || null;
        if (stock !== undefined) updateData.stock = stock;
        if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];

        const variant = await prisma.productVariant.update({
            where: { id: variantId, productId },
            data: updateData,
        });

        // Sync product isActive based on total variant stock
        if (stock !== undefined) {
            const allVariants = await prisma.productVariant.findMany({
                where: { productId },
                select: { stock: true },
            });
            const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
            await prisma.product.update({
                where: { id: productId },
                data: { isActive: totalStock > 0, stock: totalStock },
            });
        }

        return NextResponse.json({ variant });
    } catch (error) {
        console.error("Error updating variant:", error);
        return NextResponse.json({ error: "Failed to update variant" }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/products/[id]/variants
 * Deletes a variant (pass variantId in body).
 */
export async function DELETE(req: Request, { params }: Params) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: productId } = await params;

    try {
        const { variantId } = await req.json();

        if (!variantId) {
            return NextResponse.json({ error: "variantId is required" }, { status: 400 });
        }

        await prisma.productVariant.delete({
            where: { id: variantId, productId },
        });

        // Sync product stock after deletion
        const remaining = await prisma.productVariant.findMany({
            where: { productId },
            select: { stock: true },
        });
        const totalStock = remaining.reduce((sum, v) => sum + v.stock, 0);
        await prisma.product.update({
            where: { id: productId },
            data: { stock: totalStock, isActive: totalStock > 0 || remaining.length === 0 },
        });

        return NextResponse.json({ message: "Variant deleted" });
    } catch (error) {
        console.error("Error deleting variant:", error);
        return NextResponse.json({ error: "Failed to delete variant" }, { status: 500 });
    }
}
