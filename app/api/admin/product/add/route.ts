import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AddProductSchema = z.object({
    title: z.string().min(1, { error: "Title is required" }).max(200, { error: "Title must be less than 200 characters" }),
    description: z.string().min(1, { error: "Description is required" }),
    titleEn: z.string().max(200).optional().nullable(),
    descriptionEn: z.string().optional().nullable(),
    price: z.number().int().positive({ error: "Price must be a positive number" }),
    salePrice: z.number().int().positive({ error: "Sale price must be a positive number" }).optional().nullable(),
    category: z.string().min(1, { error: "Category is required" }),
    categoryNameEn: z.string().max(100).optional().nullable(),
    stock: z.number().int().min(0, { error: "Stock cannot be negative" }).default(0),
    images: z.array(z.string().min(1, { error: "Image path cannot be empty" })).min(1, { error: "At least one image is required" }),
    thumbnail: z.string().min(1, { error: "Thumbnail path cannot be empty" }),
});

/**
 * POST /api/admin/product/add
 * Create a new product (Admin only)
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized: Please login to continue" },
            { status: 401 }
        );
    }

    if (session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Forbidden: Admin access required" },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();

        const validation = AddProductSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: errors
                },
                { status: 400 }
            );
        }

        const { title, description, titleEn, descriptionEn, price, salePrice, category, categoryNameEn, stock, images, thumbnail } =
            validation.data;

        // Additional validation: Thumbnail must be in images array
        if (!images.includes(thumbnail)) {
            return NextResponse.json(
                {
                    error: "Invalid thumbnail",
                    message: "Thumbnail must be one of the uploaded images"
                },
                { status: 400 }
            );
        }

        // Additional validation: Check for duplicate images
        const uniqueImages = new Set(images);
        if (uniqueImages.size !== images.length) {
            return NextResponse.json(
                {
                    error: "Duplicate images detected",
                    message: "Each image URL must be unique"
                },
                { status: 400 }
            );
        }

        // Create product with images and translations in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the product (Turkish is the main language)
            const product = await tx.product.create({
                data: {
                    title,
                    description,
                    price,
                    salePrice: salePrice ?? null,
                    stock,
                    thumbnail,
                    isActive: stock > 0,
                    category: {
                        connectOrCreate: {
                            where: { name: category },
                            create: { name: category, nameEn: categoryNameEn?.trim() || null },
                        },
                    },
                },
            });

            // 2. Create product images
            const createdImages = await Promise.all(
                images.map((url) =>
                    tx.productImage.create({
                        data: { productId: product.id, url },
                    })
                )
            );

            // 3. Save English translation if provided
            if (titleEn?.trim()) {
                await tx.productTranslation.create({
                    data: {
                        productId: product.id,
                        locale: "en",
                        title: titleEn.trim(),
                        description: descriptionEn?.trim() ?? null,
                    },
                });
            }

            return { product, images: createdImages };
        });

        return NextResponse.json(
            {
                success: true,
                message: "Product created successfully",
                product: result.product,
                images: result.images,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating product:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Duplicate entry", message: "A product with this information already exists" },
                { status: 409 }
            );
        }

        if (error.code === "P2003") {
            return NextResponse.json(
                { error: "Foreign key constraint failed", message: "Invalid reference in product data" },
                { status: 400 }
            );
        }

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: "Invalid JSON", message: "Request body must be valid JSON" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error", message: "Failed to create product. Please try again later." },
            { status: 500 }
        );
    }
}
