import { notFound } from "next/navigation";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { getLocale } from "next-intl/server";
import ProductDetailClient from "./ProductDetailClient";

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const locale = await getLocale();

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            images: { orderBy: { createdAt: "asc" } },
            category: true,
            translations: true,
            variants: { orderBy: { createdAt: "asc" } },
            reviews: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!product) {
        notFound();
    }

    // Apply locale translation if available, fallback to default fields
    const translation = product.translations.find((t) => t.locale === locale);
    const localizedProduct = {
        ...product,
        title: translation?.title ?? product.title,
        description: translation?.description ?? product.description,
        category: product.category ? {
            ...product.category,
            name: locale === "en" && product.category.nameEn ? product.category.nameEn : product.category.name,
        } : null,
    };

    const averageRating =
        product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
            : 0;

    const session = await auth();

    const userReview = (session
        ? product.reviews.find((review) => review.userId === session.user.id)
        : null) || null;

    return (
        <ProductDetailClient
            product={localizedProduct}
            averageRating={averageRating}
            userReview={userReview}
            isAuthenticated={!!session}
        />
    );
}
