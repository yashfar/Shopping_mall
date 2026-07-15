import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSortOrder } from "@@/lib/sort-utils";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "12");
        const query = searchParams.get("q") || "";
        const category = searchParams.get("category") || "";
        const minPrice = searchParams.get("min") ? parseFloat(searchParams.get("min")!) * 100 : undefined;
        const maxPrice = searchParams.get("max") ? parseFloat(searchParams.get("max")!) * 100 : undefined;
        const minRating = searchParams.get("rating") ? parseInt(searchParams.get("rating")!) : undefined;
        const sort = searchParams.get("sort") || undefined;
        const locale = searchParams.get("locale") || "tr";

        const whereClause: any = { isActive: true };

        if (query) {
            whereClause.OR = [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
            ];
        }

        if (category) {
            // Match by Turkish name OR English name
            whereClause.category = {
                OR: [
                    { name: { equals: category, mode: "insensitive" } },
                    { nameEn: { equals: category, mode: "insensitive" } },
                ],
            };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            whereClause.price = {};
            if (minPrice !== undefined) whereClause.price.gte = minPrice;
            if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
        }

        const skip = (page - 1) * pageSize;
        const take = pageSize + 1;

        const products = await prisma.product.findMany({
            where: whereClause,
            include: {
                reviews: { select: { id: true, rating: true } },
                variants: { select: { id: true, color: true, colorHex: true, stock: true } },
                category: { select: { id: true, name: true, nameEn: true } },
                translations: {
                    where: { locale },
                    select: { title: true, description: true },
                },
            },
            orderBy: getSortOrder(sort),
            skip,
            take,
        });

        let filteredProducts = minRating
            ? products.filter((p) => {
                if (p.reviews.length === 0) return false;
                const avg = p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length;
                return avg >= minRating;
            })
            : products;

        const hasMore = filteredProducts.length > pageSize;
        if (hasMore) filteredProducts = filteredProducts.slice(0, pageSize);

        // Apply locale translation
        const localizedProducts = filteredProducts.map(({ translations, category, ...p }) => {
            const tr = translations[0];
            return {
                ...p,
                title: tr?.title ?? p.title,
                description: tr?.description ?? p.description,
                category: category ? {
                    ...category,
                    name: locale === "en" && category.nameEn ? category.nameEn : category.name,
                } : null,
            };
        });

        return NextResponse.json({ products: localizedProducts, hasMore });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
