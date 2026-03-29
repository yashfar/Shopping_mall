import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/categories/[id] - Rename category
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const { name } = await req.json();

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        if (name.trim().length > 100) {
            return NextResponse.json({ error: "Category name must be 100 characters or less" }, { status: 400 });
        }

        const category = await prisma.category.update({
            where: { id },
            data: { name: name.trim() },
            include: { _count: { select: { products: true } } },
        });

        return NextResponse.json(category);
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
        }
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

// DELETE /api/admin/categories/[id] - Delete category
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const productCount = await prisma.product.count({ where: { categoryId: id } });

        if (productCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${productCount} product(s) are using this category` },
                { status: 400 }
            );
        }

        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ message: "Category deleted" });
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
