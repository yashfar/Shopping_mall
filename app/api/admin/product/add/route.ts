import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { translateToEnglish } from "@@/lib/translate";

const PriceEntrySchema = z.object({
    currencyCode: z.enum(["TRY", "USD"]),
    price: z.number().int().positive({ error: "Price must be a positive integer" }),
    salePrice: z.number().int().positive({ error: "Sale price must be a positive integer" }).optional().nullable(),
});

const AddProductSchema = z.object({
    title: z.string().min(1, { error: "Title is required" }).max(200, { error: "Title must be less than 200 characters" }),
    description: z.string().min(1, { error: "Description is required" }),
    titleEn: z.string().max(200).optional().nullable(),
    descriptionEn: z.string().optional().nullable(),
    prices: z.array(PriceEntrySchema).min(1, { error: "At least one price is required" }),
    categoryId: z.string().min(1, { error: "Category is required" }),
    stock: z.number().int().min(0, { error: "Stock cannot be negative" }).default(0),
    images: z.array(z.string().min(1, { error: "Image path cannot be empty" })).min(1, { error: "At least one image is required" }),
    thumbnail: z.string().min(1, { error: "Thumbnail path cannot be empty" }),
});

export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized: Please login to continue" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const validation = AddProductSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));
            return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
        }

        const { title, description, titleEn, descriptionEn, prices, categoryId, stock, images, thumbnail } = validation.data;

        const tryPrice = prices.find((p) => p.currencyCode === "TRY");
        if (!tryPrice) {
            return NextResponse.json({ error: "TRY price is required" }, { status: 400 });
        }

        if (!images.includes(thumbnail)) {
            return NextResponse.json({ error: "Invalid thumbnail", message: "Thumbnail must be one of the uploaded images" }, { status: 400 });
        }

        const uniqueImages = new Set(images);
        if (uniqueImages.size !== images.length) {
            return NextResponse.json({ error: "Duplicate images detected", message: "Each image URL must be unique" }, { status: 400 });
        }

        // Auto-translate to English if admin left EN fields empty
        let finalTitleEn = titleEn?.trim() || null;
        let finalDescriptionEn = descriptionEn?.trim() || null;
        if (!finalTitleEn) {
            const translated = await translateToEnglish(title, description);
            finalTitleEn = translated.titleEn;
            finalDescriptionEn = translated.descriptionEn;
        }

        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    title,
                    description,
                    price: tryPrice.price,
                    salePrice: tryPrice.salePrice ?? null,
                    stock,
                    thumbnail,
                    isActive: stock > 0,
                    category: { connect: { id: categoryId } },
                },
            });

            await Promise.all(
                images.map((url) => tx.productImage.create({ data: { productId: product.id, url } }))
            );

            await Promise.all(
                prices.map((p) =>
                    tx.productPrice.create({
                        data: {
                            productId: product.id,
                            currencyCode: p.currencyCode,
                            price: p.price,
                            salePrice: p.salePrice ?? null,
                        },
                    })
                )
            );

            await tx.productTranslation.create({
                data: {
                    productId: product.id,
                    locale: "en",
                    title: finalTitleEn!,
                    description: finalDescriptionEn ?? null,
                },
            });

            return product;
        });

        return NextResponse.json(
            { success: true, message: "Product created successfully", product: result },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating product:", error);

        if (error.code === "P2002") {
            return NextResponse.json({ error: "Duplicate entry", message: "A product with this information already exists" }, { status: 409 });
        }
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Category not found", message: "The selected category does not exist" }, { status: 400 });
        }
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid JSON", message: "Request body must be valid JSON" }, { status: 400 });
        }

        return NextResponse.json({ error: "Internal server error", message: "Failed to create product. Please try again later." }, { status: 500 });
    }
}
