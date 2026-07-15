import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { sendStockAlertEmail } from "@@/lib/mail";

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
                category: true,
                translations: true,
                variants: { orderBy: { createdAt: "asc" } },
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
        const { title, description, titleEn, descriptionEn, price, salePrice, stock, isActive, images, thumbnail, category, categoryNameEn, shippingDays } = await req.json();

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (shippingDays !== undefined) updateData.shippingDays = shippingDays?.trim() || "3-5";
        if (price !== undefined) updateData.price = Math.round(price);
        if (salePrice !== undefined) updateData.salePrice = salePrice ? Math.round(salePrice) : null;
        if (category !== undefined) {
            updateData.category = {
                connectOrCreate: {
                    where: { name: category },
                    create: { name: category, nameEn: categoryNameEn?.trim() || null },
                },
            };
            // If EN name provided and category already exists, update it too
            if (categoryNameEn !== undefined) {
                (async () => {
                    try {
                        await prisma.category.updateMany({
                            where: { name: category },
                            data: { nameEn: categoryNameEn?.trim() || null },
                        });
                    } catch {}
                })();
            }
        }
        if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

        if (stock !== undefined) {
            updateData.stock = stock;
            if (stock <= 0) {
                updateData.isActive = false;
            } else {
                updateData.isActive = true;
            }
        }

        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        const product = await prisma.$transaction(async (tx) => {
            const updated = await tx.product.update({
                where: { id },
                data: updateData,
            });

            if (images && Array.isArray(images)) {
                await tx.productImage.deleteMany({ where: { productId: id } });
                if (images.length > 0) {
                    await tx.productImage.createMany({
                        data: images.map((url: string) => ({ productId: id, url })),
                    });
                }
            }

            // Handle English translation upsert
            if (titleEn !== undefined) {
                if (titleEn?.trim()) {
                    await tx.productTranslation.upsert({
                        where: { productId_locale: { productId: id, locale: "en" } },
                        create: {
                            productId: id,
                            locale: "en",
                            title: titleEn.trim(),
                            description: descriptionEn?.trim() ?? null,
                        },
                        update: {
                            title: titleEn.trim(),
                            description: descriptionEn?.trim() ?? null,
                        },
                    });
                } else {
                    await tx.productTranslation.deleteMany({
                        where: { productId: id, locale: "en" },
                    });
                }
            }

            return updated;
        });

        // Send stock alert emails if stock was added (non-blocking)
        if (stock !== undefined && stock > 0) {
            (async () => {
                try {
                    const alerts = await prisma.stockAlert.findMany({
                        where: { productId: id, notified: false },
                        include: { user: { select: { email: true, firstName: true, locale: true } } },
                    });

                    if (alerts.length > 0) {
                        const storeUrl = process.env.NEXT_PUBLIC_URL ?? "";
                        for (const alert of alerts) {
                            const userLocale = (alert.user.locale === "tr" ? "tr" : "en") as "tr" | "en";
                            await sendStockAlertEmail(alert.user.email, {
                                productTitle: product.title,
                                productUrl: `${storeUrl}/product/${id}`,
                                thumbnail: product.thumbnail,
                                firstName: alert.user.firstName,
                                locale: userLocale,
                            });
                        }

                        await prisma.stockAlert.updateMany({
                            where: { productId: id, notified: false },
                            data: { notified: true },
                        });
                    }
                } catch (err) {
                    console.error("Failed to send stock alerts:", err);
                }
            })();
        }

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
        // Check if product has orders
        const orderCount = await prisma.orderItem.count({
            where: { productId: id },
        });

        if (orderCount > 0) {
            // Can't delete — has order history. Deactivate instead.
            await prisma.product.update({
                where: { id },
                data: { isActive: false },
            });
            return NextResponse.json({
                message: "deactivated",
                reason: "Product has orders and cannot be permanently deleted. It has been deactivated instead.",
            });
        }

        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ message: "deleted" });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
