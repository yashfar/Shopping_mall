import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/categories?locale=tr|en
// Returns active categories with locale-aware names. Falls back to TR when EN is missing.
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") ?? "tr";

    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            include: { translations: true },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(
            categories.map((cat) => {
                const trTrans = cat.translations.find((t) => t.locale === "tr");
                const enTrans = cat.translations.find((t) => t.locale === "en");

                const resolved = locale === "en" && enTrans ? enTrans : trTrans;

                return {
                    id: cat.id,
                    name: resolved?.name ?? cat.name,
                    slug: resolved?.slug ?? "",
                };
            })
        );
    } catch (err) {
        console.error("GET /api/categories error:", err);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}
