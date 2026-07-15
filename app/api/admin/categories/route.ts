import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@@/lib/slugify";
import { translateText } from "@@/lib/translate";

// GET /api/admin/categories - List all categories with translations and product count
export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
            include: {
                translations: { orderBy: { locale: "asc" } },
                _count: { select: { products: true } },
            },
        });
        return NextResponse.json(categories);
    } catch (err) {
        console.error("GET /api/admin/categories error:", err);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

// POST /api/admin/categories - Create new category
// Body: { translations: [{ locale: "tr", name: "..." }, { locale: "en", name: "..." }] }
// Turkish translation is required; English is optional.
export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

        // Explicit check before create to return a clear conflict error
        const existing = await prisma.category.findUnique({ where: { name: trName } });
        if (existing) {
            return NextResponse.json({ error: "A category with this Turkish name already exists." }, { status: 409 });
        }

        const category = await prisma.$transaction(async (tx) => {
            const cat = await tx.category.create({
                data: {
                    name: trName,
                    nameEn: enName,
                },
            });

            await tx.categoryTranslation.create({
                data: { categoryId: cat.id, locale: "tr", name: trName, slug: toSlug(trName) },
            });

            await tx.categoryTranslation.create({
                data: { categoryId: cat.id, locale: "en", name: enName, slug: toSlug(enName) },
            });

            return tx.category.findUnique({
                where: { id: cat.id },
                include: {
                    translations: { orderBy: { locale: "asc" } },
                    _count: { select: { products: true } },
                },
            });
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "A category with this name already exists." }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
