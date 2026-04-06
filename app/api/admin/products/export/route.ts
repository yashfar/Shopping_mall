import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return new Response("Forbidden", { status: 403 });
    }

    const products = await prisma.product.findMany({
        include: {
            category: true,
            translations: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const escape = (s: string | null | undefined) => {
        if (!s) return "";
        if (s.includes(",") || s.includes("\n") || s.includes('"')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const header = "title,description,title_en,description_en,price,salePrice,stock,category,isActive,thumbnail";

    const rows = products.map((p) => {
        const enTranslation = p.translations.find((t) => t.locale === "en");
        return [
            escape(p.title),
            escape(p.description),
            escape(enTranslation?.title),
            escape(enTranslation?.description),
            (p.price / 100).toFixed(2).replace(".", ","),
            p.salePrice ? (p.salePrice / 100).toFixed(2).replace(".", ",") : "",
            p.stock,
            escape(p.category?.name ?? ""),
            p.isActive,
            escape(p.thumbnail),
        ].join(",");
    });

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="products-${new Date().toISOString().split("T")[0]}.csv"`,
        },
    });
}
