import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@@/lib/slugify";
import { translateText } from "@@/lib/translate";

// PATCH /api/admin/categories/[id] - Update category translations
// Body: { translations: [{ locale: "tr", name: "..." }, { locale: "en", name: "..." }] }
// Turkish translation is required. Omitting English deletes the EN translation row.
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
        const body = await req.json();
        const { translations } = body;

        if (!Array.isArray(translations) || translations.length === 0) {
            return NextResponse.json({ error: "translations array is required." }, { status: 400 });
        }

        const trEntry = translations.find((t: any) => t.locale === "tr");
        if (!trEntry || typeof trEntry.name !== "string" || !trEntry.name.trim()) {
            return NextResponse.json({ error: "Turkish category name is required." }, { status: 400 });
        }

        const trName = trEntry.name.trim();
        if (trName.length > 100) {
            return NextResponse.json({ error: "Category name must be 100 characters or less." }, { status: 400 });
        }

        const enEntry = translations.find((t: any) => t.locale === "en");
        const enName = enEntry?.name?.trim() || await translateText(trName);
        if (enName && enName.length > 100) {
            return NextResponse.json({ error: "English category name must be 100 characters or less." }, { status: 400 });
        }

        const category = await prisma.$transaction(async (tx) => {
            await tx.category.update({
                where: { id },
                data: { name: trName, nameEn: enName },
            });

            await tx.categoryTranslation.upsert({
                where: { categoryId_locale: { categoryId: id, locale: "tr" } },
                update: { name: trName, slug: toSlug(trName) },
                create: { categoryId: id, locale: "tr", name: trName, slug: toSlug(trName) },
            });

            await tx.categoryTranslation.upsert({
                where: { categoryId_locale: { categoryId: id, locale: "en" } },
                update: { name: enName, slug: toSlug(enName) },
                create: { categoryId: id, locale: "en", name: enName, slug: toSlug(enName) },
            });

            return tx.category.findUnique({
                where: { id },
                include: {
                    translations: { orderBy: { locale: "asc" } },
                    _count: { select: { products: true } },
                },
            });
        });

        return NextResponse.json(category);
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "A category with this name already exists." }, { status: 409 });
        }
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Category not found." }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

// DELETE /api/admin/categories/[id] - Delete category (only if no products are using it)
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
