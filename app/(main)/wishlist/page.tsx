import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WishlistContent from "./WishlistContent";
import { getTranslations } from "next-intl/server";

export default async function WishlistPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/wishlist");
    }

    const items = await prisma.wishlist.findMany({
        where: { userId: session.user.id },
        include: {
            product: {
                include: {
                    reviews: { select: { rating: true } },
                    category: { select: { name: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const products = items.map((item) => item.product);

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
