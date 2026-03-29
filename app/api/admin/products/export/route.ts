import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return new Response("Forbidden", { status: 403 });
    }

    const products = await prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" },
    });

    const header = "title,description,price,salePrice,stock,category,isActive,thumbnail";
    const rows = products.map((p) => {
        const escape = (s: string | null) => {
            if (!s) return "";
            if (s.includes(",") || s.includes("\n") || s.includes('"')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };
        return [
            escape(p.title),
            escape(p.description),
            (p.price / 100).toFixed(2),
            p.salePrice ? (p.salePrice / 100).toFixed(2) : "",
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
