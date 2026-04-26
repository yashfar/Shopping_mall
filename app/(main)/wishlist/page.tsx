import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WishlistContent from "./WishlistContent";
import { getTranslations, getLocale } from "next-intl/server";

export default async function WishlistPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/wishlist");
    }

    const locale = await getLocale();

    const items = await prisma.wishlist.findMany({
        where: { userId: session.user.id },
        include: {
            product: {
                include: {
                    reviews: { select: { rating: true } },
                    category: { select: { name: true, nameEn: true } },
                    translations: { where: { locale }, select: { title: true, description: true } },
                    variants: { select: { id: true, color: true, colorHex: true, stock: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const products = items.map(({ product }) => {
        const { translations, category, ...p } = product;
        const tr = translations[0];
        return {
            ...p,
            title: tr?.title ?? p.title,
            description: tr?.description ?? p.description,
            category: category
                ? { ...category, name: locale === "en" && category.nameEn ? category.nameEn : category.name }
                : null,
        };
    });

    const t = await getTranslations("wishlist");

    return (
        <div className="bg-[#FAFAFA] min-h-screen pb-16">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight">{t("title")}</h1>
                    <p className="text-[#A9A9A9] font-medium mt-2">
                        {products.length === 1 ? t("itemSaved", { count: products.length }) : t("itemsSaved", { count: products.length })}
                    </p>
                </div>

                <WishlistContent initialProducts={products} />
            </div>
        </div>
    );
}
