import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AddProductSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
    description: z.string().min(1, "Description is required"),
    price: z.number().int().positive("Price must be a positive number"),
    category: z.string().min(1, "Category is required"),
    stock: z.number().int().min(0, "Stock cannot be negative").default(0),
    images: z.array(z.string().min(1, "Image path cannot be empty")).min(1, "At least one image is required"),
    thumbnail: z.string().min(1, "Thumbnail path cannot be empty"),
});

/**
 * POST /api/admin/product/add
 * Create a new product (Admin only)
 */
export async function POST(req: Request) {
    const session = await auth();

    // Check authentication
    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized: Please login to continue" },
            { status: 401 }
        );
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Forbidden: Admin access required" },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();

        // Validate input with Zod
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

        const { title, description, price, category, stock, images, thumbnail } =
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

        // Create product with images in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the product
            const product = await tx.product.create({
                data: {
                    title,
                    description,
                    price,
                    category,
                    stock,
                    thumbnail,
                    isActive: stock > 0, // Auto-activate if stock > 0
                },
            });

            // 2. Create product images
            const createdImages = await Promise.all(
                images.map((url) =>
                    tx.productImage.create({
                        data: {
                            productId: product.id,
                            url,
                        },
                    })
                )
            );

            // 3. Return complete product with images
            return {
                product,
                images: createdImages,
            };
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

        // Handle Prisma-specific errors
        if (error.code === "P2002") {
            return NextResponse.json(
                {
                    error: "Duplicate entry",
                    message: "A product with this information already exists"
                },
                { status: 409 }
            );
        }

        if (error.code === "P2003") {
            return NextResponse.json(
                {
                    error: "Foreign key constraint failed",
                    message: "Invalid reference in product data"
                },
                { status: 400 }
            );
        }

        // Handle JSON parsing errors
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                {
                    error: "Invalid JSON",
                    message: "Request body must be valid JSON"
                },
                { status: 400 }
            );
        }

        // Generic error response
        return NextResponse.json(
            {
                error: "Internal server error",
                message: "Failed to create product. Please try again later."
            },
            { status: 500 }
        );
    }
}
