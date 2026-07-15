import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ProductCreateSchema = z.object({
    title: z
        .string()
        .min(1, { error: "Title is required" })
        .max(255, { error: "Title must be less than 255 characters" }),
    description: z.string().optional().nullable(),
    price: z
        .number({ error: "Price must be a number" })
        .int({ error: "Price must be a whole number (cents)" })
        .positive({ error: "Price must be greater than 0" }),
    stock: z
        .number({ error: "Stock must be a number" })
        .int({ error: "Stock must be a whole number" })
        .min(0, { error: "Stock cannot be negative" })
        .default(0),
    isActive: z.boolean().default(true),
    categoryId: z.string().optional().nullable(),
});

/**
 * GET /api/admin/products
 * Returns paginated products (admin only).
 * Query params: search, page (1-based), limit (default 20, max 100)
 */
export async function GET(req: Request) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("search") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    try {
        const where = query
            ? {
                  OR: [
                      { title: { contains: query, mode: "insensitive" as const } },
                      { description: { contains: query, mode: "insensitive" as const } },
                  ],
              }
            : {};

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { variants: { select: { id: true, stock: true } } },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/products
 * Creates a new product (admin only).
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const validation = ProductCreateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: validation.error.issues.map((i) => ({
                        field: i.path.join("."),
                        message: i.message,
                    })),
                },
                { status: 400 }
            );
        }

        const { title, description, price, stock, isActive, categoryId } =
            validation.data;

        const product = await prisma.product.create({
            data: {
                title,
                description: description ?? null,
                price,
                stock,
                isActive,
                categoryId: categoryId ?? null,
            },
        });

        return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
