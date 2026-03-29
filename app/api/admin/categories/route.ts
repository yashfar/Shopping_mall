import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// GET /api/admin/categories - List all categories with product count
export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: { select: { products: true } },
            },
        });
        return NextResponse.json(categories);
    } catch {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

// POST /api/admin/categories - Create new category
export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name } = await req.json();

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        if (name.trim().length > 100) {
            return NextResponse.json({ error: "Category name must be 100 characters or less" }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: { name: name.trim() },
            include: { _count: { select: { products: true } } },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
